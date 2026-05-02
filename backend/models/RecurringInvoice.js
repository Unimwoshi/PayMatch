import mongoose from 'mongoose'

const recurringInvoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  customerName: { type: String, required: true },
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
  }],
  vatEnabled: { type: Boolean, default: false },
  vatRate: { type: Number, default: 7.5 },
  whtEnabled: { type: Boolean, default: false },
  whtRate: { type: Number, default: 5 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  currency: { type: String, default: 'NGN' },
  notes: { type: String },
  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  nextRunDate: { type: Date, required: true },
  autoSend: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  lastGeneratedAt: { type: Date, default: null },
  invoicesGenerated: { type: Number, default: 0 },
}, { timestamps: true })

const RecurringInvoice = mongoose.model('RecurringInvoice', recurringInvoiceSchema)
export default RecurringInvoice