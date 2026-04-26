import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export const registerUser = async (req, res) => {
  
  try {
    const { name, email, password, businessName } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields' })
    }
    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }
    const user = await User.create({ name, email, password, businessName })


    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      token: generateToken(user._id)
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }

    const user = await User.findOne({ email })

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      token: generateToken(user._id)
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}