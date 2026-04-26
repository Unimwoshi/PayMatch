import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  fileUrl: {
    type: String
  }
}, { timestamps: true })

const Payment = mongoose.model('Payment', paymentSchema)
export default Payment;