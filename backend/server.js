import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import connectDB from './config/db.js'
import { generalLimiter } from './middleware/security.js'
import logger from './utils/logger.js'
import customerRoutes from './routes/customerRoutes.js'
import authRoutes from './routes/authRoutes.js'
import invoiceRoutes from './routes/invoiceRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import reconciliationRoutes from './routes/reconciliationRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import templateRoutes from './routes/templateRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import reminderRoutes from './routes/reminderRoutes.js'
import { startScheduler } from './services/schedulerService.js'
import recurringRoutes from './routes/recurringRoutes.js'
import taxRoutes from './routes/taxRoutes.js'
import paymentLinkRoutes from './routes/paymentLinkRoutes.js'
import { exportAllData } from './controllers/exportController.js'
import protect from './middleware/authMiddleware.js'
import adminRoutes from './routes/adminRoutes.js'
import { submitNIN, submitCAC } from './controllers/verificationController.js'



dotenv.config()
connectDB()
startScheduler()

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

app.use(generalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/reconciliation', reconciliationRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/recurring', recurringRoutes)
app.use('/api/tax', taxRoutes)
app.use('/api/payment-links', paymentLinkRoutes)
app.get('/api/export/all', protect, exportAllData)
app.use('/api/admin', adminRoutes)
app.post('/api/verify/nin', protect, submitNIN)
app.post('/api/verify/cac', protect, submitCAC)

app.use((err, req, res, next) => {
  logger.error({ event: 'unhandled_error', error: err.message, stack: err.stack })
  res.status(500).json({ message: 'Something went wrong' })
})


app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  // intentionally skipping req.query — it's read-only in Express 5
  next();
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => logger.info({ event: 'server_started', port: PORT }))