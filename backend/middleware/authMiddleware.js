import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import logger from '../utils/logger.js'

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    const token = authHeader.split(' ')[1]

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password -refreshTokens')

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' })
      }

      next()
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' })
      }
      return res.status(401).json({ message: 'Not authorized, token failed' })
    }
  } catch (error) {
    logger.error({ event: 'auth_middleware_error', error: error.message })
    res.status(500).json({ message: 'Server error' })
  }
}

export default protect