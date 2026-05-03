import Customer from '../models/Customer.js'
import Invoice from '../models/Invoice.js'
import Payment from '../models/Payment.js'
import logger from '../utils/logger.js'

// Recalculates all intelligence fields for a customer
export const recalculateCustomerStats = async (customerId, userId) => {
  try {
    const invoices = await Invoice.find({
      user: userId,
      customer: customerId
    })

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalOutstanding = invoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.remainingBalance || 0), 0)
    const totalPaid = totalInvoiced - totalOutstanding

    const lastInvoice = invoices.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt))[0]

    // Average days to pay — from invoices that are paid
    const paidInvoices = invoices.filter(inv =>
      inv.status === 'paid' && inv.issueDate
    )

    let averageDaysToPay = 0
    if (paidInvoices.length > 0) {
      const payments = await Payment.find({
        user: userId,
        invoice: { $in: paidInvoices.map(i => i._id) }
      })

      const daysList = paidInvoices.map(inv => {
        const payment = payments.find(p =>
          p.invoice?.toString() === inv._id.toString()
        )
        if (!payment) return null
        return Math.floor(
          (new Date(payment.paymentDate) - new Date(inv.issueDate)) /
          (1000 * 60 * 60 * 24)
        )
      }).filter(d => d !== null && d >= 0)

      if (daysList.length > 0) {
        averageDaysToPay = Math.round(
          daysList.reduce((a, b) => a + b, 0) / daysList.length
        )
      }
    }

    // Reliability score — % of invoices paid on or before due date
    const invoicesWithDueDate = invoices.filter(inv =>
      inv.dueDate && inv.status === 'paid'
    )
    let reliabilityScore = 100
    if (invoicesWithDueDate.length > 0) {
      const payments = await Payment.find({
        user: userId,
        invoice: { $in: invoicesWithDueDate.map(i => i._id) }
      })
      const onTime = invoicesWithDueDate.filter(inv => {
        const payment = payments.find(p =>
          p.invoice?.toString() === inv._id.toString()
        )
        return payment && new Date(payment.paymentDate) <= new Date(inv.dueDate)
      })
      reliabilityScore = Math.round(
        (onTime.length / invoicesWithDueDate.length) * 100
      )
    }

    await Customer.findByIdAndUpdate(customerId, {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      averageDaysToPay,
      reliabilityScore,
      lastInvoiceDate: lastInvoice?.createdAt || null
    })
  } catch (err) {
    logger.error({ event: 'recalculate_customer_stats_error', error: err.message })
  }
}

export const createCustomer = async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, currency, paymentTerms, notes } = req.body
    if (!name) return res.status(400).json({ message: 'Customer name is required' })

    const customer = await Customer.create({
      user: req.user._id,
      name, contactPerson, phone, email,
      address, currency, paymentTerms, notes
    })

    res.status(201).json(customer)
  } catch (error) {
    logger.error({ event: 'create_customer_error', error: error.message })
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user._id }).sort({ name: 1 })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) return res.status(404).json({ message: 'Customer not found' })
    if (customer.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    // Return with latest invoices
    const invoices = await Invoice.find({
      user: req.user._id,
      customer: req.params.id
    }).sort({ createdAt: -1 }).limit(5)

    res.json({ ...customer.toObject(), recentInvoices: invoices })
    await audit(req, 'customer:created', { entity: 'customer', entityId: customer._id, metadata: { name: customer.name } })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) return res.status(404).json({ message: 'Customer not found' })
    if (customer.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) return res.status(404).json({ message: 'Customer not found' })
    if (customer.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }
    await customer.deleteOne()
    res.json({ message: 'Customer deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}