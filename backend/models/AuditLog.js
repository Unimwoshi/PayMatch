import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Auth
      'auth:login', 'auth:logout', 'auth:register', 'auth:password_change', 'auth:token_refresh',
      // Invoice
      'invoice:created', 'invoice:updated', 'invoice:deleted', 'invoice:pdf_generated', 'invoice:payment_link_generated',
      // Payment
      'payment:created', 'payment:matched', 'payment:updated', 'payment:deleted',
      // Customer
      'customer:created', 'customer:updated', 'customer:deleted',
      // Expense
      'expense:created', 'expense:updated', 'expense:deleted', 'expense:receipt_uploaded',
      // Reminder
      'reminder:sent',
      // Template
      'template:saved', 'template:uploaded',
      // Recurring
      'recurring:created', 'recurring:paused', 'recurring:resumed', 'recurring:cancelled', 'recurring:invoice_generated',
      // Settings
      'settings:profile_updated', 'settings:bank_updated', 'settings:keys_saved',
      // Export
      'export:data_exported',
      // Admin
      'admin:user_suspended', 'admin:user_restored', 'admin:flag_created', 'admin:flag_resolved', 'admin:plan_changed',
      // Risk
      'risk:flag_raised', 'risk:score_updated',
      // Verification
      'verification:nin_submitted', 'verification:nin_approved', 'verification:nin_rejected',
      'verification:cac_submitted', 'verification:cac_approved', 'verification:cac_rejected',
    ]
  },
  entity: { type: String }, // 'invoice', 'payment', 'customer' etc
  entityId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  userAgent: { type: String },
  adminAction: { type: Boolean, default: false },
}, {
  timestamps: true,
  // TTL index — auto-delete after 90 days
  // Remove this index when you upgrade to M10
})

// TTL index — documents expire 90 days after creation
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

// Index for fast queries
auditLogSchema.index({ user: 1, createdAt: -1 })
auditLogSchema.index({ action: 1, createdAt: -1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog