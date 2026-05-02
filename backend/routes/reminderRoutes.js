import express from 'express'
import {
  getOverdueInvoices,
  generateReminder,
  getReminderHistory
} from '../controllers/reminderController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/overdue', protect, getOverdueInvoices)
router.post('/generate', protect, generateReminder)
router.get('/history', protect, getReminderHistory)

export default router