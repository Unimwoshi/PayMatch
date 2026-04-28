import express from 'express'
import {
  runReconciliation,
  getMatches,
  confirmMatch,
  rejectMatch,
  getDashboardStats
} from '../controllers/reconciliationController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.post('/run', runReconciliation)
router.get('/', getMatches)
router.get('/dashboard', getDashboardStats)
router.put('/:id/confirm', confirmMatch)
router.delete('/:id', rejectMatch)

export default router