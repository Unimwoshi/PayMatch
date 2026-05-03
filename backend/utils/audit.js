import AuditLog from '../models/AuditLog.js'
import logger from './logger.js'

const audit = async (req, action, options = {}) => {
  try {
    const { entity, entityId, metadata } = options
    await AuditLog.create({
      user: req.user?._id || options.userId,
      action,
      entity: entity || null,
      entityId: entityId || null,
      metadata: metadata || {},
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      adminAction: options.adminAction || false,
    })
  } catch (err) {
    // Never let audit failure break the main request
    logger.error({ event: 'audit_log_error', error: err.message })
  }
}

export default audit