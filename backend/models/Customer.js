import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  notes: {
    type: String,
    trim: true
  },
  totalInvoiced: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  totalOutstanding: {
    type: Number,
    default: 0
  },
  averageDaysToPay: {
    type: Number,
    default: 0
  },
  reliabilityScore: {
    type: Number,
    default: 100
  },
  lastInvoiceDate: {
    type: Date
  }
}, { timestamps: true })

const Customer = mongoose.model('Customer', customerSchema)
export default Customer