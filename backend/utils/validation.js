import Joi from 'joi'

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be less than 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required'
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  businessName: Joi.string().max(100).optional().allow('')
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
})

export const invoiceSchema = Joi.object({
  invoiceNumber: Joi.string().max(50).optional().allow(''),
  customerName: Joi.string().min(1).max(100).required().messages({
    'any.required': 'Customer name is required'
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required'
  }),
  issueDate: Joi.date().required().messages({
    'any.required': 'Issue date is required'
  }),
  dueDate: Joi.date().optional(),
  description: Joi.string().max(500).optional().allow(''),
  source: Joi.string().valid('upload', 'manual').optional()
})

export const paymentSchema = Joi.object({
  customerName: Joi.string().min(1).max(100).required().messages({
    'any.required': 'Customer name is required'
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required'
  }),
  paymentDate: Joi.date().required().messages({
    'any.required': 'Payment date is required'
  }),
  narration: Joi.string().max(500).optional().allow(''),
  reference: Joi.string().max(100).optional().allow(''),
  source: Joi.string().valid('bank_alert', 'receipt', 'whatsapp', 'manual').optional()
})

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false })
  if (error) {
    const message = error.details[0].message
    return res.status(400).json({ message })
  }
  next()
}