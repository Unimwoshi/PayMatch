import RecurringInvoice from '../models/RecurringInvoice.js'

const getNextRunDate = (startDate, frequency) => {
  const next = new Date(startDate)
  switch (frequency) {
    case 'weekly':    next.setDate(next.getDate() + 7); break
    case 'biweekly':  next.setDate(next.getDate() + 14); break
    case 'monthly':   next.setMonth(next.getMonth() + 1); break
    case 'quarterly': next.setMonth(next.getMonth() + 3); break
    case 'annually':  next.setFullYear(next.getFullYear() + 1); break
  }
  return next
}

export const createRecurring = async (req, res) => {
  try {
    const {
      customerName, customer, lineItems, vatEnabled, vatRate,
      whtEnabled, whtRate, discount, discountType, currency,
      notes, frequency, startDate, endDate, autoSend
    } = req.body

    if (!customerName || !lineItems?.length || !frequency || !startDate) {
      return res.status(400).json({ message: 'Customer, line items, frequency and start date are required' })
    }

    const nextRunDate = new Date(startDate)

    const recurring = await RecurringInvoice.create({
      user: req.user._id,
      customer: customer || null,
      customerName, lineItems,
      vatEnabled, vatRate, whtEnabled, whtRate,
      discount, discountType, currency, notes,
      frequency, startDate, endDate: endDate || null,
      nextRunDate, autoSend: autoSend || false,
    })

    res.status(201).json(recurring)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getRecurring = async (req, res) => {
  try {
    const recurring = await RecurringInvoice.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(recurring)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const updateRecurring = async (req, res) => {
  try {
    const rec = await RecurringInvoice.findById(req.params.id)
    if (!rec) return res.status(404).json({ message: 'Not found' })
    if (rec.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }
    Object.assign(rec, req.body)
    await rec.save()
    res.json(rec)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const deleteRecurring = async (req, res) => {
  try {
    const rec = await RecurringInvoice.findById(req.params.id)
    if (!rec) return res.status(404).json({ message: 'Not found' })
    if (rec.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }
    await rec.deleteOne()
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}