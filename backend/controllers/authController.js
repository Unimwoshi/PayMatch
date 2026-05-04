import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js'
import { logoUploader } from '../config/cloudinary.js'
import audit from '../utils/audit.js'

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' })
}

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
}

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  })
}

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, businessName } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }

    const user = await User.create({ name, email, password, businessName })

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshTokens.push({ token: refreshToken })
    user.lastLogin = new Date()
    await user.save()

    setRefreshCookie(res, refreshToken)

    logger.info({ event: 'user_registered', userId: user._id, email: user.email })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      plan: user.plan,
      role: user.role,  
      onboardingComplete: user.onboardingComplete,
      token: accessToken
    })
    await audit(req, 'auth:register', { entity: 'user', entityId: user._id, metadata: { email: user.email } })
  } catch (error) {
    logger.error({ event: 'register_error', error: error.message })
    res.status(500).json({ message: 'Server error' })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      logger.warn({ event: 'login_failed', reason: 'user_not_found', email })
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000)
      return res.status(423).json({
        message: `Account locked. Try again in ${minutesLeft} minute(s).`
      })
    }

    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
      user.failedLoginAttempts += 1
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000)
        user.failedLoginAttempts = 0
        logger.warn({ event: 'account_locked', userId: user._id, email })
      }
      await user.save()
      logger.warn({ event: 'login_failed', reason: 'wrong_password', email })
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    user.failedLoginAttempts = 0
    user.lockUntil = undefined
    user.lastLogin = new Date()

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshTokens.push({ token: refreshToken })
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5)
    }
    await user.save()

    setRefreshCookie(res, refreshToken)

    logger.info({ event: 'login_success', userId: user._id })

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      plan: user.plan,
      role: user.role,  
      onboardingComplete: user.onboardingComplete,
      token: accessToken
    })
    await audit(req, 'auth:login', { metadata: { email: user.email } })
  } catch (error) {
    logger.error({ event: 'login_error', error: error.message })
    res.status(500).json({ message: 'Server error' })
  }
}

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const tokenExists = user.refreshTokens.some(t => t.token === token)
    if (!tokenExists) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const newAccessToken = generateAccessToken(user._id)
    res.json({ token: newAccessToken })
  } catch (error) {
    logger.warn({ event: 'refresh_token_failed', error: error.message })
    res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

export const logoutUser = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (token && req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: { token } }
      })
    }
    res.clearCookie('refreshToken')
    logger.info({ event: 'logout', userId: req.user?._id })
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokens')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, businessName, email, businessDetails, weeklyEmailEnabled } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (name) user.name = name
    if (businessName) user.businessName = businessName
    if (email) user.email = email
    if (weeklyEmailEnabled !== undefined) user.weeklyEmailEnabled = weeklyEmailEnabled
    if (businessDetails) {
      user.businessDetails = { ...user.businessDetails.toObject?.() || user.businessDetails, ...businessDetails }
    }

    await user.save()
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      plan: user.plan,
      role: user.role,  
      onboardingComplete: user.onboardingComplete,
      businessDetails: user.businessDetails,
      weeklyEmailEnabled: user.weeklyEmailEnabled,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const completeOnboarding = async (req, res) => {
  try {
    const { businessName, address, phone, bankName, accountNumber, accountName, currency, vatEnabled } = req.body

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (businessName) user.businessName = businessName
    user.onboardingComplete = true
    user.businessDetails = {
      address: address || '',
      phone: phone || '',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      accountName: accountName || '',
      currency: currency || 'NGN',
      vatEnabled: vatEnabled ?? true
    }

    await user.save()

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      plan: user.plan,
      role: user.role,  
      onboardingComplete: user.onboardingComplete,
      businessDetails: user.businessDetails
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const uploadBusinessLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const result = await logoUploader.upload(req.file.buffer, req.file.mimetype)

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.businessDetails = {
      ...user.businessDetails,
      logoUrl: result.secure_url
    }

    await user.save()
    res.json({ logoUrl: result.secure_url })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}