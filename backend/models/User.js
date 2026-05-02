import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  businessName: {
    type: String,
    trim: true
  },
  plan: {
    type: String,
    enum: ['free', 'student', 'starter', 'business', 'pro'],
    default: 'free'
  },
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  businessDetails: {
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  bankName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  accountName: { type: String, default: '' },
  currency: { type: String, default: 'NGN' },
  vatEnabled: { type: Boolean, default: true },
  logoUrl: { type: String, default: '' }
  },
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected', 'expired'],
    default: 'none'
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now }
  }],
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  lastLogin: {
    type: Date
  }

  paymentKeys: {
    paystack: {
      secretKey: { type: String },
      publicKey: { type: String },
      provider: { type: String },
    },
    flutterwave: {
      secretKey: { type: String },
      publicKey: { type: String },
      provider: { type: String },
    }
  },

  weeklyEmailEnabled: { type: Boolean, default: true },
}, { timestamps: true })

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now()
}

const User = mongoose.model('User', userSchema)
export default User