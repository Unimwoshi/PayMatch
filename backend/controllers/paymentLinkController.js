import crypto from 'crypto'
import axios from 'axios'
import Invoice from '../models/Invoice.js'
import User from '../models/User.js'
import notify from '../utils/notify.js'

const ENCRYPTION_KEY = process.env.PAYMENT_KEY_SECRET // Must be 32 chars
const IV_LENGTH = 16

const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

const decrypt = (text) => {
  const [ivHex, encryptedHex] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
}

// POST /api/payment-links/keys — save Paystack/Flutterwave keys
export const savePaymentKeys = async (req, res) => {
  try {
    const { provider, secretKey, publicKey } = req.body
    if (!provider || !secretKey) {
      return res.status(400).json({ message: 'Provider and secret key are required' })
    }

    const encryptedSecret = encrypt(secretKey)
    const encryptedPublic = publicKey ? encrypt(publicKey) : null

    await User.findByIdAndUpdate(req.user._id, {
      [`paymentKeys.${provider}`]: {
        secretKey: encryptedSecret,
        publicKey: encryptedPublic,
        provider,
      }
    })

    res.json({ message: 'Payment keys saved successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/payment-links/generate
export const generatePaymentLink = async (req, res) => {
  try {
    const { invoiceId, provider = 'paystack' } = req.body

    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })
    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const user = await User.findById(req.user._id)
    const keys = user.paymentKeys?.[provider]
    if (!keys?.secretKey) {
      return res.status(400).json({
        message: `No ${provider} API key found. Add your keys in Settings.`
      })
    }

    const secretKey = decrypt(keys.secretKey)

    if (provider === 'paystack') {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: invoice.customerEmail || 'customer@example.com',
          amount: Math.round(invoice.remainingBalance * 100), // kobo
          reference: `INV-${invoice._id}-${Date.now()}`,
          metadata: {
            invoiceId: invoice._id.toString(),
            customerName: invoice.customerName,
            invoiceNumber: invoice.invoiceNumber,
          }
        },
        { headers: { Authorization: `Bearer ${secretKey}` } }
      )

      const link = response.data.data.authorization_url
      const reference = response.data.data.reference

      await Invoice.findByIdAndUpdate(invoiceId, {
        paymentLink: link,
        paymentReference: reference,
        paymentProvider: 'paystack',
      })

      return res.json({ link, reference, provider: 'paystack' })
    }

    if (provider === 'flutterwave') {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
          tx_ref: `INV-${invoice._id}-${Date.now()}`,
          amount: invoice.remainingBalance,
          currency: invoice.currency || 'NGN',
          redirect_url: `${process.env.FRONTEND_URL}/invoices`,
          customer: {
            email: invoice.customerEmail || 'customer@example.com',
            name: invoice.customerName,
          },
          meta: { invoiceId: invoice._id.toString() },
          customizations: { title: `Invoice ${invoice.invoiceNumber || ''}` }
        },
        { headers: { Authorization: `Bearer ${secretKey}` } }
      )

      const link = response.data.data.link

      await Invoice.findByIdAndUpdate(invoiceId, {
        paymentLink: link,
        paymentProvider: 'flutterwave',
      })

      return res.json({ link, provider: 'flutterwave' })
    }

    res.status(400).json({ message: 'Unsupported provider' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/payment-links/webhook/paystack
export const paystackWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex')

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' })
    }

    const { event, data } = req.body

    if (event === 'charge.success') {
      const invoiceId = data.metadata?.invoiceId
      if (!invoiceId) return res.sendStatus(200)

      const invoice = await Invoice.findById(invoiceId)
      if (!invoice) return res.sendStatus(200)

      const amountPaid = data.amount / 100
      const newBalance = Math.max(0, (invoice.remainingBalance || 0) - amountPaid)

      await Invoice.findByIdAndUpdate(invoiceId, {
        remainingBalance: newBalance,
        status: newBalance <= 0 ? 'paid' : 'partial',
      })

      await notify(invoice.user, {
        title: 'Payment received',
        message: `₦${amountPaid.toLocaleString()} received from ${invoice.customerName} via Paystack`,
        type: 'payment_received',
        link: '/payments'
      })
    }

    res.sendStatus(200)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/payment-links/webhook/flutterwave
export const flutterwaveWebhook = async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET
    const signature = req.headers['verif-hash']

    if (signature !== secretHash) {
      return res.status(401).json({ message: 'Invalid signature' })
    }

    const { event, data } = req.body

    if (event === 'charge.completed' && data.status === 'successful') {
      const invoiceId = data.meta?.invoiceId
      if (!invoiceId) return res.sendStatus(200)

      const invoice = await Invoice.findById(invoiceId)
      if (!invoice) return res.sendStatus(200)

      const amountPaid = data.amount
      const newBalance = Math.max(0, (invoice.remainingBalance || 0) - amountPaid)

      await Invoice.findByIdAndUpdate(invoiceId, {
        remainingBalance: newBalance,
        status: newBalance <= 0 ? 'paid' : 'partial',
      })

      await notify(invoice.user, {
        title: 'Payment received',
        message: `₦${amountPaid.toLocaleString()} received from ${invoice.customerName} via Flutterwave`,
        type: 'payment_received',
        link: '/payments'
      })
    }

    res.sendStatus(200)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}