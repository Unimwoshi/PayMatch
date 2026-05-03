import express from 'express'
import { createRecurring, getRecurring, updateRecurring, deleteRecurring } from '../controllers/recurringController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()
router.use(protect)
router.get('/', getRecurring)
router.post('/', createRecurring)
router.put('/:id', updateRecurring)
router.delete('/:id', deleteRecurring)

export default router