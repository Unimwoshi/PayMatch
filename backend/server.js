import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import connectDB from './config/db.js'
import { generalLimiter } from './middleware/security.js'
import logger from './utils/logger.js'

import authRoutes from './routes/authRoutes.js'
import invoiceRoutes from './routes/invoiceRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import reconciliationRoutes from './routes/reconciliationRoutes.js'

dotenv.config()
connectDB()

const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(mongoSanitize())
app.use(generalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/reconciliation', reconciliationRoutes)

app.use((err, req, res, next) => {
  logger.error({ event: 'unhandled_error', error: err.message, stack: err.stack })
  res.status(500).json({ message: 'Something went wrong' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => logger.info({ event: 'server_started', port: PORT }))