import Expense from '../models/Expense.js'
import { receiptUploader } from '../config/cloudinary.js'
import notify from '../utils/notify.js'

// Vendor classification rules
const VENDOR_RULES = [
  { patterns: ['ekedc', 'ikedc', 'aedc', 'bedc', 'kedco', 'enugu electric', 'ibadan electric'], category: 'Rent & Utilities' },
  { patterns: ['lawma', 'waste', 'water board', 'water corp'], category: 'Rent & Utilities' },
  { patterns: ['dhl', 'gig', 'nipost', 'fedex', 'ups', 'kwik', 'sendbox', 'konga logistics'], category: 'Logistics & Delivery' },
  { patterns: ['shoprite', 'justrite', 'spar', 'market', 'supermarket', 'trade fair'], category: 'Cost of Goods Sold' },
  { patterns: ['dangote', 'cement', 'building material', 'iron rod', 'aluminium'], category: 'Raw Materials' },
  { patterns: ['salary', 'wages', 'payroll', 'staff'], category: 'Salaries & Wages' },
  { patterns: ['google ads', 'meta ads', 'facebook ads', 'instagram ads', 'flyer', 'printing'], category: 'Marketing & Advertising' },
  { patterns: ['lawyer', 'accountant', 'consultant', 'audit', 'legal', 'notary'], category: 'Professional Services' },
  { patterns: ['uber', 'bolt', 'taxify', 'fuel', 'petrol', 'diesel', 'transport', 'airline', 'flight'], category: 'Travel & Transportation' },
  { patterns: ['generator', 'repair', 'maintenance', 'laptop', 'computer', 'equipment', 'phone'], category: 'Equipment & Maintenance' },
]

export const classifyVendor = (vendorName) => {
  if (!vendorName) return { category: 'Miscellaneous', confidence: 0 }
  const lower = vendorName.toLowerCase()
  for (const rule of VENDOR_RULES) {
    for (const pattern of rule.patterns) {
      if (lower.includes(pattern)) {
        return { category: rule.category, confidence: 85 }
      }
    }
  }
  return { category: 'Miscellaneous', confidence: 0 }
}

// GET /api/expenses
export const getExpenses = async (req, res) => {
  try {
    const { category, source, confirmed } = req.query
    const filter = { user: req.user._id }
    if (category) filter.category = category
    if (source) filter.source = source
    if (confirmed !== undefined) filter.confirmed = confirmed === 'true'

    const expenses = await Expense.find(filter).sort({ date: -1 })
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/expenses — manual entry
export const createExpense = async (req, res) => {
  try {
    const { vendor, amount, date, category, description, linkedClient, linkedInvoice } = req.body

    if (!amount || !date) {
      return res.status(400).json({ message: 'Amount and date are required' })
    }

    const { category: autoCategory, confidence } = classifyVendor(vendor)

    const expense = await Expense.create({
      user: req.user._id,
      vendor,
      amount: Number(amount),
      date,
      category: category || autoCategory,
      description,
      confidence: category ? 100 : confidence,
      source: 'manual',
      linkedClient,
      linkedInvoice: linkedInvoice || null,
      confirmed: true,
    })

    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/expenses/receipt — upload receipt, return OCR-ready data + classification
export const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    // Upload to Cloudinary
    const result = await receiptUploader.upload(req.file.buffer, req.file.mimetype)

    // Return the URL so frontend can run Tesseract on it
    // Classification happens after frontend sends back extracted text
    res.json({
      receiptUrl: result.secure_url,
      message: 'Receipt uploaded. Run OCR and send extracted data.'
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/expenses/from-ocr — receive OCR results, classify, create expense
export const createFromOCR = async (req, res) => {
  try {
    const { vendor, amount, date, description, receiptUrl, userCategory } = req.body

    if (!amount) return res.status(400).json({ message: 'Amount is required' })

    const { category: autoCategory, confidence } = classifyVendor(vendor)
    const finalCategory = userCategory || autoCategory

    const expense = await Expense.create({
      user: req.user._id,
      vendor: vendor || 'Unknown',
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      category: finalCategory,
      description,
      confidence,
      source: 'ocr',
      receiptUrl,
      confirmed: !!userCategory,
    })

    await notify(req.user._id, {
      title: 'Receipt scanned',
      message: `${vendor || 'Expense'} — ₦${Number(amount).toLocaleString()} posted to ${finalCategory}`,
      type: 'expense_created',
      link: '/receipts'
    })

    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// PUT /api/expenses/:id — confirm or correct classification
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
    if (!expense) return res.status(404).json({ message: 'Expense not found' })
    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    Object.assign(expense, req.body)
    expense.confirmed = true
    await expense.save()

    res.json(expense)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
    if (!expense) return res.status(404).json({ message: 'Expense not found' })
    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }
    await expense.deleteOne()
    res.json({ message: 'Expense deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}