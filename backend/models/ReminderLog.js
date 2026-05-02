import mongoose from 'mongoose'

const reminderLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  customerName: { type: String },
  invoiceNumber: { type: String },
  amount: { type: Number },
  tone: {
    type: String,
    enum: ['polite', 'firm', 'final'],
    required: true
  },
  message: { type: String },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true })

const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema)
export default ReminderLog