import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  narration: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['bank_alert', 'receipt', 'whatsapp', 'manual'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['matched', 'unmatched', 'partial'],
    default: 'unmatched'
  },
  // Receipt verification fields
  receiptUrl: { type: String },
  receiptExtractedAmount: { type: Number, default: null },
  receiptConfidence: { type: Number, default: 0 },
  receiptConfirmed: { type: Boolean, default: false },
  receiptMismatch: { type: Boolean, default: false },
}, { timestamps: true })

const Payment = mongoose.model('Payment', paymentSchema)
export default Payment