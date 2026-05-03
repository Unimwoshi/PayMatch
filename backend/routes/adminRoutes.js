import express from 'express'
import protect from '../middleware/authMiddleware.js'
import adminOnly from '../middleware/adminMiddleware.js'
import {
  getOverview, getUsers, getUserDetail,
  suspendUser, restoreUser, changeUserPlan,
  getRiskFlags, resolveFlag, getAuditLogs
} from '../controllers/adminController.js'

const router = express.Router()
router.use(protect, adminOnly)

router.get('/overview', getOverview)
router.get('/users', getUsers)
router.get('/users/:id', getUserDetail)
router.post('/users/:id/suspend', suspendUser)
router.post('/users/:id/restore', restoreUser)
router.post('/users/:id/plan', changeUserPlan)
router.get('/flags', getRiskFlags)
router.post('/flags/:userId/resolve', resolveFlag)
router.get('/audit', getAuditLogs)

export default router