import RiskFlag from '../models/RiskFlag.js'
import Invoice from '../models/Invoice.js'
import Payment from '../models/Payment.js'
import Customer from '../models/Customer.js'
import AuditLog from '../models/AuditLog.js'
import logger from '../utils/logger.js'
import crypto from 'crypto'

const SIGNALS = {
  NEW_ACCOUNT_HIGH_VOLUME: { points: 30, severity: 'high', type: 'new_account_high_volume' },
  ALL_INVOICES_PAID_INSTANTLY: { points: 25, severity: 'high', type: 'all_invoices_paid_instantly' },
  GHOST_CLIENT: { points: 20, severity: 'medium', type: 'ghost_client' },
  DUPLICATE_RECEIPT: { points: 25, severity: 'high', type: 'duplicate_receipt' },
  PAYMENT_MISMATCH: { points: 15, severity: 'medium', type: 'payment_mismatch' },
  SELF_MATCHED_PAYMENTS: { points: 25, severity: 'high', type: 'self_matched_payments' },
  VELOCITY_BREACH: { points: 20, severity: 'high', type: 'velocity_breach' },
  CLIENT_INVOICED_INSTANTLY: { points: 20, severity: 'medium', type: 'client_invoiced_instantly' },
}

const getTier = (score) => {
  if (score >= 76) return 'red'
  if (score >= 51) return 'orange'
  if (score >= 26) return 'yellow'
  return 'clean'
}

export const calculateRiskScore = async (userId) => {
  try {
    const now = new Date()
    const accountAge = await getAccountAgeInDays(userId)
    const signals = []

    // Signal 1: New account with high volume
    if (accountAge < 7) {
      const [clientCount, invoiceCount] = await Promise.all([
        Customer.countDocuments({ user: userId }),
        Invoice.countDocuments({ user: userId }),
      ])
      if (clientCount >= 10 && invoiceCount >= 20) {
        signals.push({
          ...SIGNALS.NEW_ACCOUNT_HIGH_VOLUME,
          description: `Account ${accountAge} days old with ${clientCount} clients and ${invoiceCount} invoices`,
          detectedAt: now,
        })
      }
    }

    // Signal 2: All invoices paid within minutes of creation
    const recentInvoices = await Invoice.find({ user: userId, status: 'paid' }).limit(20)
    if (recentInvoices.length >= 5) {
      const allInstant = recentInvoices.every(inv => {
        const diff = new Date(inv.updatedAt) - new Date(inv.createdAt)
        return diff < 5 * 60 * 1000 // under 5 minutes
      })
      if (allInstant) {
        signals.push({
          ...SIGNALS.ALL_INVOICES_PAID_INSTANTLY,
          description: 'All recent invoices marked paid within 5 minutes of creation',
          detectedAt: now,
        })
      }
    }

    // Signal 3: Ghost clients — no contact details, large invoices, immediately paid
    const customers = await Customer.find({ user: userId })
    const ghostClients = customers.filter(c => !c.phone && !c.email && !c.address)
    if (ghostClients.length > 0) {
      const ghostInvoices = await Invoice.find({
        user: userId,
        customer: { $in: ghostClients.map(c => c._id) },
        status: 'paid'
      })
      if (ghostInvoices.length > 3) {
        signals.push({
          ...SIGNALS.GHOST_CLIENT,
          description: `${ghostClients.length} clients with no contact info have ${ghostInvoices.length} paid invoices`,
          detectedAt: now,
        })
      }
    }

    // Signal 4: Self-matched payments (30%+ with no reference)
    const allPayments = await Payment.find({ user: userId })
    if (allPayments.length >= 5) {
      const noRef = allPayments.filter(p => !p.reference && p.status === 'matched')
      const ratio = noRef.length / allPayments.length
      if (ratio >= 0.3) {
        signals.push({
          ...SIGNALS.SELF_MATCHED_PAYMENTS,
          description: `${Math.round(ratio * 100)}% of matched payments have no reference number`,
          detectedAt: now,
        })
      }
    }

    // Signal 5: Invoice velocity — 15+ invoices in 2 hours
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000)
    const recentCount = await Invoice.countDocuments({
      user: userId,
      createdAt: { $gte: twoHoursAgo }
    })
    if (recentCount >= 15) {
      signals.push({
        ...SIGNALS.VELOCITY_BREACH,
        description: `${recentCount} invoices created in the last 2 hours`,
        detectedAt: now,
      })
    }

    // Calculate total score
    const score = Math.min(100, signals.reduce((sum, s) => sum + s.points, 0))
    const tier = getTier(score)

    // Upsert risk flag
    const existing = await RiskFlag.findOne({ user: userId })
    const existingSignalTypes = existing?.signals?.map(s => s.type) || []

    // Only add new signals, don't duplicate
    const newSignals = signals.filter(s => !existingSignalTypes.includes(s.type))

    await RiskFlag.findOneAndUpdate(
      { user: userId },
      {
        $set: { score, tier, lastCalculatedAt: now },
        $push: newSignals.length > 0 ? { signals: { $each: newSignals } } : {},
      },
      { upsert: true, new: true }
    )

    // Log if tier changed to orange or red
    if ((tier === 'orange' || tier === 'red') && (!existing || existing.tier !== tier)) {
      logger.warn({ event: 'risk_tier_elevated', userId, tier, score })
    }

    return { score, tier, signals }
  } catch (err) {
    logger.error({ event: 'risk_calculation_error', error: err.message })
  }
}

export const checkDuplicateReceipt = async (fileBuffer, userId) => {
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

  // Check if this hash exists anywhere in the system
  const existing = await RiskFlag.findOne({
    'signals.type': 'duplicate_receipt',
    'signals.description': { $regex: hash }
  })

  if (existing) {
    await RiskFlag.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          signals: {
            ...SIGNALS.DUPLICATE_RECEIPT,
            description: `Duplicate receipt hash detected: ${hash.slice(0, 16)}...`,
            detectedAt: new Date(),
          }
        },
        $inc: { score: SIGNALS.DUPLICATE_RECEIPT.points }
      },
      { upsert: true }
    )
    return { isDuplicate: true, hash }
  }

  return { isDuplicate: false, hash }
}

export const checkPaymentMismatch = async (invoiceAmount, paymentAmount, userId, invoiceId) => {
  if (!invoiceAmount || !paymentAmount) return
  const ratio = paymentAmount / invoiceAmount
  if (ratio > 5 || ratio < 0.1) {
    await RiskFlag.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          signals: {
            ...SIGNALS.PAYMENT_MISMATCH,
            description: `Payment ₦${paymentAmount.toLocaleString()} matched to invoice ₦${invoiceAmount.toLocaleString()} (ratio: ${ratio.toFixed(2)})`,
            detectedAt: new Date(),
          }
        },
        $inc: { score: SIGNALS.PAYMENT_MISMATCH.points }
      },
      { upsert: true }
    )
  }
}

const getAccountAgeInDays = async (userId) => {
  const { default: User } = await import('../models/User.js')
  const user = await User.findById(userId).select('createdAt')
  if (!user) return 999
  return Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
}