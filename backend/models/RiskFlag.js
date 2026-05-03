import mongoose from 'mongoose'

const signalSchema = new mongoose.Schema({
  type: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  description: { type: String },
  points: { type: Number, default: 0 },
  detectedAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
}, { _id: false })

const riskFlagSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  score: { type: Number, default: 0 },
  tier: {
    type: String,
    enum: ['clean', 'yellow', 'orange', 'red'],
    default: 'clean'
  },
  signals: [signalSchema],
  lastCalculatedAt: { type: Date, default: Date.now },
  reviewedBy: { type: String, default: null },
  reviewNote: { type: String, default: null },
  reviewedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['active', 'resolved', 'escalated'],
    default: 'active'
  },
  suspended: { type: Boolean, default: false },
}, { timestamps: true })

const RiskFlag = mongoose.model('RiskFlag', riskFlagSchema)
export default RiskFlag