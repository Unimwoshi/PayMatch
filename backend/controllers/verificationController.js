// controllers/verificationController.js
import User from '../models/User.js'
import crypto from 'crypto'
import audit from '../utils/audit.js'
import logger from '../utils/logger.js'

const ENCRYPTION_KEY = process.env.PAYMENT_KEY_SECRET?.padEnd(32).slice(0, 32)

const encrypt = (text) => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

// Mock Prembly NIN check — swap this function body for real API call when ready
const verifyNINWithPrembly = async (nin) => {
  // MOCK — replace with real API call:
  // const response = await axios.post('https://api.prembly.com/identitypass/verification/nin',
  //   { number: nin },
  //   { headers: { 'x-api-key': process.env.PREMBLY_API_KEY, 'app-id': process.env.PREMBLY_APP_ID } }
  // )
  // return { verified: response.data.status, firstName: response.data.nin_data?.firstname, lastName: response.data.nin_data?.lastname }

  // Mock returns success for any 11-digit NIN
  const isValid = /^\d{11}$/.test(nin)
  return {
    verified: isValid,
    firstName: 'Mock',
    lastName: 'User',
  }
}

// Mock CAC check
const verifyCACWithPrembly = async (cacNumber) => {
  // MOCK — replace with real API call when ready
  const isValid = /^RC\d{5,7}$/i.test(cacNumber)
  return {
    verified: isValid,
    companyName: 'Mock Company Ltd',
    status: 'active',
    directors: [],
  }
}

export const submitNIN = async (req, res) => {
  try {
    const { nin } = req.body
    if (!nin || !/^\d{11}$/.test(nin)) {
      return res.status(400).json({ message: 'NIN must be exactly 11 digits' })
    }

    const user = await User.findById(req.user._id)

    // Hash NIN to check for duplicates without storing plaintext
    const ninHash = crypto.createHash('sha256').update(nin).digest('hex')

    // Check if this NIN is already registered to another account
    const existing = await User.findOne({ ninHash, _id: { $ne: user._id } })
    if (existing) {
      await audit(req, 'verification:nin_rejected', {
        metadata: { reason: 'nin_already_registered' }
      })
      return res.status(400).json({
        message: 'This NIN is already linked to another account. If this is an error, contact support.'
      })
    }

    // Verify with Prembly (currently mocked)
    const result = await verifyNINWithPrembly(nin)

    if (!result.verified) {
      await audit(req, 'verification:nin_rejected', {
        metadata: { reason: 'nin_invalid' }
      })
      return res.status(400).json({ message: 'NIN verification failed. Please check your NIN and try again.' })
    }

    // Store encrypted NIN and hash
    user.ninHash = ninHash
    user.ninEncrypted = encrypt(nin)
    user.ninVerified = true
    user.verificationTier = user.cacVerified ? 'full' : 'nin'
    await user.save()

    await audit(req, 'verification:nin_approved', {
      metadata: { verificationTier: user.verificationTier }
    })

    res.json({
      message: 'NIN verified successfully',
      ninVerified: true,
      verificationTier: user.verificationTier,
    })
  } catch (error) {
    logger.error({ event: 'nin_verification_error', error: error.message })
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const submitCAC = async (req, res) => {
  try {
    const { cacNumber } = req.body
    if (!cacNumber) return res.status(400).json({ message: 'CAC number is required' })

    const user = await User.findById(req.user._id)

    const result = await verifyCACWithPrembly(cacNumber)

    if (!result.verified || result.status !== 'active') {
      await audit(req, 'verification:cac_rejected', {
        metadata: { reason: result.status !== 'active' ? 'company_inactive' : 'cac_invalid' }
      })
      return res.status(400).json({
        message: result.status !== 'active'
          ? 'This company appears to be inactive with CAC. Please contact CAC to resolve.'
          : 'CAC number could not be verified. Please check and try again.'
      })
    }

    user.cacNumber = encrypt(cacNumber)
    user.cacVerified = true
    user.verificationTier = user.ninVerified ? 'full' : 'cac'
    await user.save()

    await audit(req, 'verification:cac_approved', {
      metadata: { companyName: result.companyName, verificationTier: user.verificationTier }
    })

    res.json({
      message: 'CAC verified successfully',
      cacVerified: true,
      verificationTier: user.verificationTier,
      companyName: result.companyName,
    })
  } catch (error) {
    logger.error({ event: 'cac_verification_error', error: error.message })
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}