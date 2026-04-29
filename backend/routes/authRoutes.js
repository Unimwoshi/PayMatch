import express from 'express'
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateProfile
} from '../controllers/authController.js'
import protect from '../middleware/authMiddleware.js'
import { authLimiter } from '../middleware/security.js'
import { validate, registerSchema, loginSchema } from '../utils/validation.js'

const router = express.Router()

router.post('/register', authLimiter, validate(registerSchema), registerUser)
router.post('/login', authLimiter, validate(loginSchema), loginUser)
router.post('/refresh', refreshToken)
router.post('/logout', protect, logoutUser)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)

export default router