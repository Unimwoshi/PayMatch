import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'invoice_overdue',
      'payment_received',
      'match_found',
      'match_confirmed',
      'reminder_sent',
      'invoice_created',
      'client_added',
      'ocr_review',
      'budget_exceeded',
      'general'
    ],
    default: 'general'
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  }
}, { timestamps: true })

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification