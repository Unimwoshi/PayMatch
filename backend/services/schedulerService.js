import cron from 'node-cron'
import RecurringInvoice from '../models/RecurringInvoice.js'
import Invoice from '../models/Invoice.js'
import User from '../models/User.js'
import notify from '../utils/notify.js'
import logger from '../utils/logger.js'
import { sendWeeklySnapshot } from './emailService.js'

const getNextRunDate = (currentDate, frequency) => {
  const next = new Date(currentDate)
  switch (frequency) {
    case 'weekly':     next.setDate(next.getDate() + 7); break
    case 'biweekly':   next.setDate(next.getDate() + 14); break
    case 'monthly':    next.setMonth(next.getMonth() + 1); break
    case 'quarterly':  next.setMonth(next.getMonth() + 3); break
    case 'annually':   next.setFullYear(next.getFullYear() + 1); break
  }
  return next
}

export const startScheduler = () => {
  // Runs every day at 8am
  cron.schedule('0 8 * * *', async () => {
    logger.info({ event: 'scheduler_run', time: new Date() })
    const now = new Date()

    try {
      const due = await RecurringInvoice.find({
        status: 'active',
        nextRunDate: { $lte: now }
      })

      for (const recurring of due) {
        try {
          // Check end date
          if (recurring.endDate && now > new Date(recurring.endDate)) {
            recurring.status = 'cancelled'
            await recurring.save()
            continue
          }

          const user = await User.findById(recurring.user)

          // Generate the invoice
          const invoice = await Invoice.create({
            user: recurring.user,
            customer: recurring.customer,
            customerName: recurring.customerName,
            lineItems: recurring.lineItems,
            vatEnabled: recurring.vatEnabled,
            vatRate: recurring.vatRate,
            whtEnabled: recurring.whtEnabled,
            whtRate: recurring.whtRate,
            discount: recurring.discount,
            discountType: recurring.discountType,
            currency: recurring.currency,
            notes: recurring.notes,
            issueDate: now,
            bankName: user?.businessDetails?.bankName || '',
            accountNumber: user?.businessDetails?.accountNumber || '',
            accountName: user?.businessDetails?.accountName || '',
            source: 'manual',
            templateId: 'classic',
            isRecurring: true,
            recurringId: recurring._id,
          })

          // Update recurring record
          recurring.lastGeneratedAt = now
          recurring.invoicesGenerated += 1
          recurring.nextRunDate = getNextRunDate(now, recurring.frequency)
          await recurring.save()

          // Notify user
          await notify(recurring.user, {
            title: 'Recurring invoice generated',
            message: `Invoice for ${recurring.customerName} has been generated automatically`,
            type: 'invoice_created',
            link: '/invoices'
          })

          logger.info({ event: 'recurring_invoice_generated', invoiceId: invoice._id })
        } catch (err) {
          logger.error({ event: 'recurring_invoice_error', recurringId: recurring._id, error: err.message })
        }
      }
    } catch (err) {
      logger.error({ event: 'scheduler_error', error: err.message })
    }
  })

    cron.schedule('0 8 * * 1', async () => {
    logger.info({ event: 'weekly_email_run' })
    try {
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)

        const users = await User.find({ weeklyEmailEnabled: true })

        for (const user of users) {
        try {
            const [payments, expenses, invoices] = await Promise.all([
            Payment.find({ user: user._id, paymentDate: { $gte: weekStart } }),
            Expense.find({ user: user._id, confirmed: true, date: { $gte: weekStart } }),
            Invoice.find({ user: user._id, status: { $in: ['unpaid', 'partial'] }, dueDate: { $lt: now } }),
            ])

            const weekRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
            const weekExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

            const expenseByCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount
            return acc
            }, {})
            const biggestExpenseCategory = Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || null

            const clientRevenue = payments.reduce((acc, p) => {
            acc[p.customerName] = (acc[p.customerName] || 0) + p.amount
            return acc
            }, {})
            const topClient = Object.entries(clientRevenue)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || null

            await sendWeeklySnapshot(user, {
            weekRevenue, weekExpenses,
            overdueCount: invoices.length,
            topClient, biggestExpenseCategory,
            })
        } catch (err) {
            logger.error({ event: 'weekly_email_user_error', userId: user._id, error: err.message })
        }
        }
    } catch (err) {
        logger.error({ event: 'weekly_email_cron_error', error: err.message })
    }
    })

  logger.info({ event: 'scheduler_started' })
}