import express from 'express'
import {
  getExpenses,
  createExpense,
  uploadReceipt,
  createFromOCR,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js'
import protect from '../middleware/authMiddleware.js'
import { receiptUploader } from '../config/cloudinary.js'

const router = express.Router()

router.get('/', protect, getExpenses)
router.post('/', protect, createExpense)
router.post('/receipt', protect, receiptUploader.middleware.single('receipt'), uploadReceipt)
router.post('/from-ocr', protect, createFromOCR)
router.put('/:id', protect, updateExpense)
router.delete('/:id', protect, deleteExpense)

export default router