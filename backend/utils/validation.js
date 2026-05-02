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
  customerEmail: Joi.string().email().optional().allow(''),
  customerAddress: Joi.string().max(300).optional().allow(''),
  customerPhone: Joi.string().max(20).optional().allow(''),
  lineItems: Joi.array().items(
    Joi.object({
      description: Joi.string().required(),
      quantity: Joi.number().positive().required(),
      unitPrice: Joi.number().positive().required(),
    })
  ).min(1).required().messages({
    'any.required': 'At least one line item is required'
  }),
  vatEnabled: Joi.boolean().optional(),
  vatRate: Joi.number().min(0).max(100).optional(),
  whtEnabled: Joi.boolean().optional(),
  whtRate: Joi.number().min(0).max(100).optional(),
  discount: Joi.number().min(0).optional(),
  discountType: Joi.string().valid('fixed', 'percentage').optional(),
  currency: Joi.string().valid('NGN', 'USD', 'GBP', 'CNY').optional(),
  issueDate: Joi.date().required().messages({
    'any.required': 'Issue date is required'
  }),
  dueDate: Joi.date().optional().allow(null, ''),
  notes: Joi.string().max(1000).optional().allow(''),
  templateId: Joi.string().optional().allow(''),
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
  source: Joi.string().valid('bank_alert', 'receipt', 'whatsapp', 'manual').optional(),
  invoice: Joi.string().optional().allow(null, ''),
  receiptUrl: Joi.string().optional().allow(''),
  receiptExtractedAmount: Joi.number().optional().allow(null),
  receiptConfidence: Joi.number().min(0).max(100).optional(),
  receiptConfirmed: Joi.boolean().optional(),
  receiptMismatch: Joi.boolean().optional(),
})
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false })
  if (error) {
    const message = error.details[0].message
    return res.status(400).json({ message })
  }
  next()
}