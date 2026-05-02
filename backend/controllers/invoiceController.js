import Invoice from '../models/Invoice.js'
import User from '../models/User.js'
import notify from '../utils/notify.js'
import { generateClassicPDF } from '../services/pdfService.js'
import Template from '../models/Template.js'

export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerName,
      customerEmail,
      customerAddress,
      customerPhone,
      lineItems,
      vatEnabled,
      vatRate,
      whtEnabled,
      whtRate,
      discount,
      discountType,
      currency,
      issueDate,
      dueDate,
      notes,
      templateId
    } = req.body

    if (!customerName || !issueDate || !lineItems?.length) {
      return res.status(400).json({ message: 'Customer name, issue date and at least one line item are required' })
    }

    // Snapshot bank details from user profile at time of invoice creation
    const user = await User.findById(req.user._id)
    const bankName = user.businessDetails?.bankName || ''
    const accountNumber = user.businessDetails?.accountNumber || ''
    const accountName = user.businessDetails?.accountName || ''

    const invoice = await Invoice.create({
      user: req.user._id,
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
      issueDate,
      dueDate,
      bankName,
      accountNumber,
      accountName,
      notes,
      templateId: templateId || 'classic',
      source: 'manual'
    })

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