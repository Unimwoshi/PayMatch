import Invoice from '../models/Invoice.js'

// @route   POST /api/invoices
export const createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, customerName, amount, issueDate, dueDate, description } = req.body

    if (!customerName || !amount || !issueDate) {
      return res.status(400).json({ message: 'Customer name, amount and issue date are required' })
    }

    const invoice = await Invoice.create({
      user: req.user._id,
      invoiceNumber,
      customerName,
      amount,
      issueDate,
      dueDate,
      description,
      remainingBalance: amount,
      source: 'manual'
    })

    res.status(201).json(invoice)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route   GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route   GET /api/invoices/:id
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

// @route   PUT /api/invoices/:id
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }

    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route   DELETE /api/invoices/:id
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