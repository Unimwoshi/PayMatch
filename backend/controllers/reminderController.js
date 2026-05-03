import Invoice from '../models/Invoice.js'
import ReminderLog from '../models/ReminderLog.js'
import User from '../models/User.js'

const generateMessage = (tone, data) => {
  const { clientName, invoiceNumber, amount, dueDate, businessName, daysOverdue } = data

  if (tone === 'polite') {
    return `Hello ${clientName}, this is a friendly reminder that invoice ${invoiceNumber} for ${amount} from ${businessName} was due on ${dueDate}. Kindly let us know when to expect payment. Thank you.`
  }

  if (tone === 'firm') {
    return `Dear ${clientName}, we note that invoice ${invoiceNumber} for ${amount} from ${businessName} remains unpaid as of ${dueDate} (${daysOverdue} days overdue). Please arrange payment at your earliest convenience to avoid service disruption.`
  }

  if (tone === 'final') {
    return `Dear ${clientName}, this is a final notice regarding invoice ${invoiceNumber} for ${amount} from ${businessName}, now ${daysOverdue} days overdue. Please make payment immediately or contact us to discuss. Failure to respond may result in further action.`
  }

  return ''
}

const formatAmount = (amount, currency = 'NGN') => {
  const symbols = { NGN: '₦', USD: '$', GBP: '£', CNY: '¥' }
  const sym = symbols[currency] || currency
  return `${sym}${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

// GET /api/reminders/overdue — all overdue unpaid invoices
export const getOverdueInvoices = async (req, res) => {
  try {
    const now = new Date()
    const invoices = await Invoice.find({
      user: req.user._id,
      status: { $in: ['unpaid', 'partial'] },
      dueDate: { $lt: now }
    }).sort({ dueDate: 1 })

    const enriched = invoices.map(inv => ({
      ...inv.toObject(),
      daysOverdue: Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
    }))

    res.json(enriched)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/reminders/generate — generate message + wa.me link
export const generateReminder = async (req, res) => {
  try {
    const { invoiceId, tone, phoneNumber } = req.body

    if (!invoiceId || !tone) {
      return res.status(400).json({ message: 'Invoice ID and tone are required' })
    }

    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })
    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const user = await User.findById(req.user._id)
    const now = new Date()
    const daysOverdue = invoice.dueDate
      ? Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
      : 0

    const messageData = {
      clientName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : 'N/A',
      amount: formatAmount(invoice.remainingBalance || invoice.amount, invoice.currency),
      dueDate: formatDate(invoice.dueDate),
      businessName: user.businessName || 'our business',
      daysOverdue,
    }

    const message = generateMessage(tone, messageData)

    // Build wa.me link
    const phone = (phoneNumber || invoice.customerPhone || '').replace(/\D/g, '')
    const waLink = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : null

    // Log the reminder
    await ReminderLog.create({
      user: req.user._id,
      invoice: invoice._id,
      customerName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      tone,
      message,
    })

    res.json({ message, waLink, phone, daysOverdue })
    await audit(req, 'reminder:sent', { entity: 'invoice', entityId: invoice._id, metadata: { tone, customerName: invoice.customerName } })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// GET /api/reminders/history — reminder log
export const getReminderHistory = async (req, res) => {
  try {
    const logs = await ReminderLog.find({ user: req.user._id })
      .sort({ sentAt: -1 })
      .limit(100)
    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}