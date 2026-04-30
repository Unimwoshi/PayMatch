import express from 'express'
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateProfile, 
  completeOnboarding,
  uploadBusinessLogo
} from '../controllers/authController.js'
import protect from '../middleware/authMiddleware.js'
import { authLimiter } from '../middleware/security.js'
import { validate, registerSchema, loginSchema } from '../utils/validation.js'
import { logoUploader } from '../config/cloudinary.js'

const router = express.Router()

router.post('/register', authLimiter, validate(registerSchema), registerUser)
router.post('/login', authLimiter, validate(loginSchema), loginUser)
router.post('/refresh', refreshToken)
router.post('/logout', protect, logoutUser)
router.post('/onboarding', protect, completeOnboarding)
router.post('/onboarding/logo', protect, logoUploader.middleware.single('logo'), uploadBusinessLogo)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)

export default router