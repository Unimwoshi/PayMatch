import Customer from '../models/Customer.js'
import logger from '../utils/logger.js'

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
    res.json(customer)
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