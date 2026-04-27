import express from 'express'
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice
} from '../controllers/invoiceController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect) // all invoice routes require login

router.route('/')
  .get(getInvoices)
  .post(createInvoice)

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice)

export default router