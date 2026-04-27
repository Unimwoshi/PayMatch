import mongoose from 'mongoose'

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: {
    type: String,
    trim: true
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
  currency: {
    type: String,
    default: 'NGN'
  },
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  remainingBalance: {
    type: Number
  },
  fileUrl: {
    type: String  // link to uploaded file in storage
  },
  source: {
    type: String,
    enum: ['upload', 'manual'],
    default: 'manual'
  }
}, { timestamps: true })

// Auto-set remainingBalance to full amount on creation
invoiceSchema.pre('save', async function () {
  if (this.isNew && this.remainingBalance === undefined) {
    this.remainingBalance = this.amount
  }
})

const Invoice = mongoose.model('Invoice', invoiceSchema)
export default Invoice;