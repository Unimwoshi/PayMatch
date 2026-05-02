import express from 'express'
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  generateInvoicePDF
} from '../controllers/invoiceController.js'
import protect from '../middleware/authMiddleware.js'
import { validate, invoiceSchema } from '../utils/validation.js'

const router = express.Router()

router.use(protect)

router.route('/')
  .get(getInvoices)
  .post(validate(invoiceSchema), createInvoice)

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice)

router.get('/:id/pdf', protect, generateInvoicePDF)

export default router