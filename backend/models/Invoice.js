import mongoose from 'mongoose'

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number }
}, { _id: false })

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoiceNumber: { type: String, trim: true },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  customerPhone: { type: String, trim: true },

  lineItems: [lineItemSchema],

  subtotal: { type: Number, default: 0 },
  vatEnabled: { type: Boolean, default: false },
  vatRate: { type: Number, default: 7.5 },
  vatAmount: { type: Number, default: 0 },
  whtEnabled: { type: Boolean, default: false },
  whtRate: { type: Number, default: 5 },
  whtAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  amount: { type: Number },
  currency: { type: String, default: 'NGN' },

  issueDate: { type: Date, required: true },
  dueDate: { type: Date },

  bankName: { type: String, trim: true },
  accountNumber: { type: String, trim: true },
  accountName: { type: String, trim: true },

  notes: { type: String, trim: true },
  templateId: { type: String, default: 'classic' },

  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  remainingBalance: { type: Number },
  fileUrl: { type: String },
  source: {
    type: String,
    enum: ['upload', 'manual'],
    default: 'manual'
  }
}, { timestamps: true })

invoiceSchema.pre('save', function () {
  // Recalculate line item subtotals
  if (this.lineItems?.length) {
    this.lineItems.forEach(item => {
      item.subtotal = item.quantity * item.unitPrice
    })
    this.subtotal = this.lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  }

  // Apply discount
  let discountedTotal = this.subtotal || 0
  if (this.discount > 0) {
    discountedTotal = this.discountType === 'percentage'
      ? discountedTotal * (1 - this.discount / 100)
      : discountedTotal - this.discount
  }


  this.vatAmount = this.vatEnabled ? discountedTotal * (this.vatRate / 100) : 0


  this.whtAmount = this.whtEnabled ? discountedTotal * (this.whtRate / 100) : 0


  this.amount = discountedTotal + this.vatAmount - this.whtAmount

  // Remaining balance on new invoices
  if (this.isNew && this.remainingBalance === undefined) {
    this.remainingBalance = this.amount
  }
})

const Invoice = mongoose.model('Invoice', invoiceSchema)
export default Invoice