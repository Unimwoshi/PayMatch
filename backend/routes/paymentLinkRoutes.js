import express from 'express'
import {
  savePaymentKeys, generatePaymentLink,
  paystackWebhook, flutterwaveWebhook
} from '../controllers/paymentLinkController.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/keys', protect, savePaymentKeys)
router.post('/generate', protect, generatePaymentLink)
router.post('/webhook/paystack', paystackWebhook)
router.post('/webhook/flutterwave', flutterwaveWebhook)

export default router