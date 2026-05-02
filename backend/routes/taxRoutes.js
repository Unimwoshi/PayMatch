import express from 'express'
import { getTaxSummary, exportTaxPDF, exportTaxCSV } from '../controllers/taxController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()
router.use(protect)
router.get('/summary', getTaxSummary)
router.get('/export/pdf', exportTaxPDF)
router.get('/export/csv', exportTaxCSV)

export default router