import User from '../models/User.js'
import Invoice from '../models/Invoice.js'
import Payment from '../models/Payment.js'
import Customer from '../models/Customer.js'
import Expense from '../models/Expense.js'
import AuditLog from '../models/AuditLog.js'
import RiskFlag from '../models/RiskFlag.js'
import audit from '../utils/audit.js'
import logger from '../utils/logger.js'

// GET /api/admin/overview
export const getOverview = async (req, res) => {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      totalUsers, newThisMonth, newThisWeek,
      totalInvoices, totalPayments,
      flaggedAccounts, suspendedCount,
      totalRevenue,
      signupsByDay,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: monthStart } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: weekStart } }),
      Invoice.countDocuments(),
      Payment.countDocuments(),
      RiskFlag.countDocuments({ tier: { $in: ['yellow', 'orange', 'red'] }, status: 'active' }),
      User.countDocuments({ suspended: true }),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ])

    res.json({
      totalUsers, newThisMonth, newThisWeek,
      totalInvoices, totalPayments,
      flaggedAccounts, suspendedCount,
      totalRevenue: totalRevenue[0]?.total || 0,
      signupsByDay,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const { search, plan, status, risk, page = 1, limit = 50 } = req.query
    const filter = { role: { $ne: 'admin' } }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
      ]
    }
    if (plan) filter.plan = plan
    if (status === 'suspended') filter.suspended = true
    if (status === 'active') filter.suspended = false

    const users = await User.find(filter)
      .select('-password -refreshTokens -ninHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await User.countDocuments(filter)

    // Attach risk flags
    const userIds = users.map(u => u._id)
    const riskFlags = await RiskFlag.find({ user: { $in: userIds } })
    const riskMap = {}
    riskFlags.forEach(r => { riskMap[r.user.toString()] = r })

    const enriched = users.map(u => ({
      ...u.toObject(),
      riskScore: riskMap[u._id.toString()]?.score || 0,
      riskTier: riskMap[u._id.toString()]?.tier || 'clean',
    }))

    // Filter by risk if requested
    const filtered = risk ? enriched.filter(u => u.riskTier === risk) : enriched

    res.json({ users: filtered, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// GET /api/admin/users/:id
export const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshTokens -ninHash')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const [invoices, payments, customers, expenses, riskFlag, auditLogs] = await Promise.all([
      Invoice.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
      Payment.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
      Customer.countDocuments({ user: user._id }),
      Expense.countDocuments({ user: user._id }),
      RiskFlag.findOne({ user: user._id }),
      AuditLog.find({ user: user._id }).sort({ createdAt: -1 }).limit(50),
    ])

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    res.json({
      user,
      stats: { totalInvoiced, totalPaid, customerCount: customers, expenseCount: expenses },
      recentInvoices: invoices,
      recentPayments: payments,
      riskFlag,
      auditLogs,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/admin/users/:id/suspend
export const suspendUser = async (req, res) => {
  try {
    const { reason } = req.body
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot suspend admin' })

    user.suspended = true
    user.suspendedAt = new Date()
    user.suspendedReason = reason || 'Suspended by admin'
    await user.save()

    await audit(req, 'admin:user_suspended', {
      entity: 'user', entityId: user._id,
      metadata: { reason, targetEmail: user.email },
      adminAction: true,
    })

    logger.warn({ event: 'user_suspended', userId: user._id, adminId: req.user._id, reason })
    res.json({ message: 'User suspended' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/admin/users/:id/restore
export const restoreUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.suspended = false
    user.suspendedAt = null
    user.suspendedReason = null
    await user.save()

    await audit(req, 'admin:user_restored', {
      entity: 'user', entityId: user._id,
      metadata: { targetEmail: user.email },
      adminAction: true,
    })

    res.json({ message: 'User restored' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/admin/users/:id/plan
export const changeUserPlan = async (req, res) => {
  try {
    const { plan } = req.body
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const oldPlan = user.plan
    user.plan = plan
    await user.save()

    await audit(req, 'admin:plan_changed', {
      entity: 'user', entityId: user._id,
      metadata: { oldPlan, newPlan: plan, targetEmail: user.email },
      adminAction: true,
    })

    res.json({ message: 'Plan updated', plan })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// GET /api/admin/flags
export const getRiskFlags = async (req, res) => {
  try {
    const { tier, status = 'active' } = req.query
    const filter = { status }
    if (tier) filter.tier = tier

    const flags = await RiskFlag.find(filter)
      .populate('user', 'name email businessName plan createdAt suspended')
      .sort({ score: -1, updatedAt: -1 })

    res.json(flags)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/admin/flags/:userId/resolve
export const resolveFlag = async (req, res) => {
  try {
    const { note } = req.body
    const flag = await RiskFlag.findOne({ user: req.params.userId })
    if (!flag) return res.status(404).json({ message: 'Flag not found' })

    flag.status = 'resolved'
    flag.reviewedBy = req.user.email
    flag.reviewNote = note || ''
    flag.reviewedAt = new Date()
    await flag.save()

    await audit(req, 'admin:flag_resolved', {
      entity: 'user', entityId: req.params.userId,
      metadata: { note, previousTier: flag.tier },
      adminAction: true,
    })

    res.json({ message: 'Flag resolved' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// GET /api/admin/audit
export const getAuditLogs = async (req, res) => {
  try {
    const { userId, action, page = 1, limit = 100 } = req.query
    const filter = {}
    if (userId) filter.user = userId
    if (action) filter.action = action

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await AuditLog.countDocuments(filter)

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}