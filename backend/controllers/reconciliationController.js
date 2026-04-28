import Invoice from '../models/Invoice.js'
import Payment from '../models/Payment.js'
import ReconciliationMatch from '../models/ReconciliationMatch.js'
import Fuse from 'fuse.js'

const getNameScore = (invoiceName, paymentName) => {
  const fuse = new Fuse([invoiceName], { threshold: 0.6, includeScore: true })
  const result = fuse.search(paymentName)
  if (result.length === 0) return 0
  return Math.round((1 - result[0].score) * 100)
}

const getDateScore = (invoiceDueDate, paymentDate) => {
  if (!invoiceDueDate) return 50
  const diffDays = Math.abs(
    (new Date(paymentDate) - new Date(invoiceDueDate)) / (1000 * 60 * 60 * 24)
  )
  if (diffDays === 0) return 100
  if (diffDays <= 3) return 80
  if (diffDays <= 7) return 60
  if (diffDays <= 14) return 40
  return 10
}

const getAmountScore = (invoiceAmount, paymentAmount) => {
  if (invoiceAmount === paymentAmount) return 100
  const diff = Math.abs(invoiceAmount - paymentAmount)
  const percentDiff = (diff / invoiceAmount) * 100
  if (percentDiff <= 1) return 90
  if (percentDiff <= 5) return 70
  if (percentDiff <= 10) return 50
  return 0
}

const getMatchStatus = (invoice, payment) => {
  if (payment.amount === invoice.amount) return 'paid'
  if (payment.amount < invoice.amount) return 'partial'
  if (payment.amount > invoice.amount) return 'overpaid'
}

export const runReconciliation = async (req, res) => {
  try {
    const userId = req.user._id

    const invoices = await Invoice.find({
      user: userId,
      status: { $in: ['unpaid', 'partial'] }
    })

    const payments = await Payment.find({
      user: userId,
      status: 'unmatched'
    })

    if (invoices.length === 0 || payments.length === 0) {
      return res.json({ message: 'No unmatched data to reconcile', matches: [] })
    }

    const matches = []

    for (const payment of payments) {
      let bestMatch = null
      let bestScore = 0

      for (const invoice of invoices) {
        const nameScore = getNameScore(invoice.customerName, payment.customerName)
        const amountScore = getAmountScore(invoice.remainingBalance, payment.amount)
        const dateScore = getDateScore(invoice.dueDate, payment.paymentDate)

        const totalScore = (amountScore * 0.5) + (nameScore * 0.35) + (dateScore * 0.15)

        if (totalScore > bestScore) {
          bestScore = totalScore
          bestMatch = invoice
        }
      }

      if (bestMatch && bestScore >= 40) {
        const matchStatus = getMatchStatus(bestMatch, payment)

        const match = await ReconciliationMatch.create({
          user: userId,
          invoice: bestMatch._id,
          payment: payment._id,
          matchedAmount: payment.amount,
          confidenceScore: Math.round(bestScore),
          matchType: 'auto',
          status: bestScore >= 70 ? 'confirmed' : 'pending_review'
        })

        const newBalance = bestMatch.remainingBalance - payment.amount
        await Invoice.findByIdAndUpdate(bestMatch._id, {
          status: matchStatus === 'overpaid' ? 'paid' : matchStatus,
          remainingBalance: newBalance <= 0 ? 0 : newBalance
        })

        await Payment.findByIdAndUpdate(payment._id, {
          status: matchStatus === 'partial' ? 'partial' : 'matched'
        })

        matches.push({
          matchId: match._id,
          invoice: {
            id: bestMatch._id,
            customerName: bestMatch.customerName,
            amount: bestMatch.amount,
            invoiceNumber: bestMatch.invoiceNumber
          },
          payment: {
            id: payment._id,
            customerName: payment.customerName,
            amount: payment.amount,
            reference: payment.reference
          },
          confidenceScore: Math.round(bestScore),
          status: match.status,
          matchStatus
        })
      }
    }

    res.json({
      message: `Reconciliation complete. ${matches.length} match(es) found.`,
      matches
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getMatches = async (req, res) => {
  try {
    const matches = await ReconciliationMatch.find({ user: req.user._id })
      .populate('invoice', 'customerName amount invoiceNumber status')
      .populate('payment', 'customerName amount reference status')
      .sort({ createdAt: -1 })

    res.json(matches)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const confirmMatch = async (req, res) => {
  try {
    const match = await ReconciliationMatch.findById(req.params.id)

    if (!match) {
      return res.status(404).json({ message: 'Match not found' })
    }

    if (match.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    match.status = 'confirmed'
    match.matchType = 'manual'
    await match.save()

    res.json({ message: 'Match confirmed', match })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const rejectMatch = async (req, res) => {
  try {
    const match = await ReconciliationMatch.findById(req.params.id)

    if (!match) {
      return res.status(404).json({ message: 'Match not found' })
    }

    if (match.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    await Invoice.findByIdAndUpdate(match.invoice, {
      status: 'unpaid',
      remainingBalance: match.matchedAmount
    })

    await Payment.findByIdAndUpdate(match.payment, {
      status: 'unmatched'
    })

    await match.deleteOne()

    res.json({ message: 'Match rejected and reverted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id

    const invoices = await Invoice.find({ user: userId })
    const payments = await Payment.find({ user: userId })

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalReceived = payments.reduce((sum, pay) => sum + pay.amount, 0)
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.remainingBalance, 0)

    const unpaidCount = invoices.filter(inv => inv.status === 'unpaid').length
    const partialCount = invoices.filter(inv => inv.status === 'partial').length
    const paidCount = invoices.filter(inv => inv.status === 'paid').length

    const today = new Date()
    const overdueInvoices = invoices.filter(inv =>
      inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < today
    )

    res.json({
      totalInvoiced,
      totalReceived,
      totalOutstanding,
      invoiceCounts: {
        total: invoices.length,
        unpaid: unpaidCount,
        partial: partialCount,
        paid: paidCount,
        overdue: overdueInvoices.length
      },
      paymentCounts: {
        total: payments.length,
        matched: payments.filter(p => p.status === 'matched').length,
        unmatched: payments.filter(p => p.status === 'unmatched').length
      },
      overdueInvoices: overdueInvoices.map(inv => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        amount: inv.amount,
        remainingBalance: inv.remainingBalance,
        dueDate: inv.dueDate,
        daysOverdue: Math.floor((today - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
      }))
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}