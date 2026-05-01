import express from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll
} from '../controllers/notificationController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/', getNotifications)
router.put('/read-all', markAllAsRead)
router.delete('/clear-all', clearAll)
router.put('/:id/read', markAsRead)
router.delete('/:id', deleteNotification)

export default router