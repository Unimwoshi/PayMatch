import Payment from '../models/Payment.js'

// @route   POST /api/payments
export const createPayment = async (req, res) => {
  try {
    const { customerName, amount, paymentDate, narration, reference, source } = req.body

    if (!customerName || !amount || !paymentDate) {
      return res.status(400).json({ message: 'Customer name, amount and payment date are required' })
    }

    const payment = await Payment.create({
      user: req.user._id,
      customerName,
      amount,
      paymentDate,
      narration,
      reference,
      source: source || 'manual',
      status: 'unmatched'
    })

    res.status(201).json(payment)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route   GET /api/payments
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(payments)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route   GET /api/payments/:id
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    res.json(payment)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route   PUT /api/payments/:id
export const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route   DELETE /api/payments/:id
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    await payment.deleteOne()
    res.json({ message: 'Payment deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}