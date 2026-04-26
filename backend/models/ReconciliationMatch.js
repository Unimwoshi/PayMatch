import mongoose from 'mongoose'

const reconciliationMatchSchema = new mongoose.Schema({
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
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  matchedAmount: {
    type: Number,
    required: true
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100
  },
  matchType: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto'
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending_review', 'rejected'],
    default: 'pending_review'
  },
  notes: {
    type: String
  }
}, { timestamps: true })

const ReconciliationMatch = mongoose.model('ReconciliationMatch', reconciliationMatchSchema)
export default ReconciliationMatch;