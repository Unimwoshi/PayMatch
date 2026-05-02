import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: { type: String, trim: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  category: {
    type: String,
    enum: [
      'Rent & Utilities',
      'Salaries & Wages',
      'Logistics & Delivery',
      'Cost of Goods Sold',
      'Raw Materials',
      'Marketing & Advertising',
      'Professional Services',
      'Equipment & Maintenance',
      'Travel & Transportation',
      'Miscellaneous'
    ],
    default: 'Miscellaneous'
  },
  description: { type: String, trim: true },
  confidence: { type: Number, default: 0 },      // 0-100, from OCR classification
  source: {
    type: String,
    enum: ['ocr', 'manual'],
    default: 'manual'
  },
  receiptUrl: { type: String },                   // Cloudinary URL
  linkedClient: { type: String, trim: true },     // optional client/project link
  linkedInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  confirmed: { type: Boolean, default: false },   // user confirmed classification
}, { timestamps: true })

const Expense = mongoose.model('Expense', expenseSchema)
export default Expense