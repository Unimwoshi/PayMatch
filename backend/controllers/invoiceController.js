import Invoice from '../models/Invoice.js'
import User from '../models/User.js'
import notify from '../utils/notify.js'
import { generateClassicPDF } from '../services/pdfService.js'
import Template from '../models/Template.js'
import { recalculateCustomerStats } from './customerController.js'
import { getExchangeRates } from '../services/fxService.js'

export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber, customerName, customerEmail, customerAddress,
      customerPhone, customer, lineItems, vatEnabled, vatRate,
      whtEnabled, whtRate, discount, discountType, currency,
      issueDate, dueDate, notes, templateId
    } = req.body

    if (!customerName || !issueDate || !lineItems?.length) {
      return res.status(400).json({ message: 'Customer name, issue date and at least one line item are required' })
    }

    const forceCreate = req.query.force === 'true'

    // ── Duplicate detection ──────────────────────────────────────────
    if (!forceCreate && customer) {
      const subtotal = lineItems.reduce((sum, item) =>
        sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), 0)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const similar = await Invoice.findOne({
        user: req.user._id,
        customer,
        issueDate: { $gte: thirtyDaysAgo },
        amount: { $gte: subtotal * 0.9, $lte: subtotal * 1.1 }
      })

      if (similar) {
        return res.status(409).json({
          message: `You may have already invoiced ${customerName} for a similar amount on ${new Date(similar.issueDate).toLocaleDateString('en-NG')}. Create anyway?`,
          code: 'DUPLICATE_WARNING',
          existingInvoice: {
            id: similar._id,
            invoiceNumber: similar.invoiceNumber,
            amount: similar.amount,
            issueDate: similar.issueDate,
          }
        })
      }
    }

  

    // ── FX rate snapshot ─────────────────────────────────────────────
    const user = await User.findById(req.user._id)
    let exchangeRateAtCreation = 1
    if (currency && currency !== 'NGN') {
      const rates = await getExchangeRates()
      exchangeRateAtCreation = rates[currency] || 1
    }

    const bankName = user.businessDetails?.bankName || ''
    const accountNumber = user.businessDetails?.accountNumber || ''
    const accountName = user.businessDetails?.accountName || ''

    const invoice = await Invoice.create({
      user: req.user._id,
      customer: customer || null,
      invoiceNumber,
      customerName,
      customerEmail,
      customerAddress,
      customerPhone,
      lineItems,
      vatEnabled: vatEnabled ?? user.businessDetails?.vatEnabled ?? false,
      vatRate: vatRate ?? 7.5,
      whtEnabled: whtEnabled ?? false,
      whtRate: whtRate ?? 5,
      discount: discount ?? 0,
      discountType: discountType ?? 'fixed',
      currency: currency || user.businessDetails?.currency || 'NGN',
      exchangeRateAtCreation,
      issueDate,
      dueDate,
      bankName,
      accountNumber,
      accountName,
      notes,
      templateId: templateId || 'classic',
      source: 'manual'
    })

    if (invoice.customer) {
      await recalculateCustomerStats(invoice.customer, req.user._id)
    }

    await notify(req.user._id, {
      title: 'Invoice created',
      message: `Invoice for ${invoice.customerName} — ${invoice.currency} ${invoice.amount.toLocaleString()}`,
      type: 'invoice_created',
      link: '/invoices'
    })

    res.status(201).json(invoice)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    res.json(invoice)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    // Apply updates then let pre-save hook recalculate totals
    Object.assign(invoice, req.body)
    await invoice.save()

    if (invoice.customer) {
      await recalculateCustomerStats(invoice.customer, req.user._id)
    }

    res.json(invoice)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    await invoice.deleteOne()
    res.json({ message: 'Invoice deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const generateInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })
    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const user = await User.findById(req.user._id).select('-password -refreshTokens')

    // Get user's default template field positions if any
    const defaultTemplate = await Template.findOne({ user: req.user._id, isDefault: true })
    const fieldPositions = defaultTemplate?.fieldPositions?.length
      ? defaultTemplate.fieldPositions
      : null

    const pdfBuffer = await generateClassicPDF(invoice, user, fieldPositions)

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber || invoice._id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    })

    res.send(pdfBuffer)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}