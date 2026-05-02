import express from 'express'
import {
  getTemplates,
  uploadCustomTemplate,
  saveFieldPositions,
  getDefaultTemplate,
  deleteTemplate
} from '../controllers/templateController.js'
import protect from '../middleware/authMiddleware.js'
import { templateUploader } from '../config/cloudinary.js'

const router = express.Router()

router.get('/', protect, getTemplates)
router.get('/default', protect, getDefaultTemplate)
router.post('/upload', protect, templateUploader.middleware.single('template'), uploadCustomTemplate)
router.put('/:id/positions', protect, saveFieldPositions)
router.delete('/:id', protect, deleteTemplate)

export default router