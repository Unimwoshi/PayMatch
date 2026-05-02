import nodemailer from 'nodemailer'
import logger from '../utils/logger.js'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail app password
  }
})

export const sendWeeklySnapshot = async (user, stats) => {
  try {
    const fmt = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin-bottom: 4px;">Weekly Business Snapshot</h2>
        <p style="color: #6B7280; font-size: 13px; margin-bottom: 24px;">
          Here's your summary for the past week
        </p>

        <div style="background: #F9FAFB; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #6B7280;">Revenue this week</td>
              <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">${fmt(stats.weekRevenue)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #6B7280;">Expenses this week</td>
              <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">${fmt(stats.weekExpenses)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #6B7280;">Invoices overdue</td>
              <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #EF4444; text-align: right;">${stats.overdueCount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #6B7280;">Top paying client</td>
              <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">${stats.topClient || '—'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #6B7280;">Biggest expense</td>
              <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">${stats.biggestExpenseCategory || '—'}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 11px; color: #9CA3AF; text-align: center;">
          Powered by Aether · <a href="${process.env.FRONTEND_URL}/settings" style="color: #9CA3AF;">Unsubscribe</a>
        </p>
      </div>
    `

    await transporter.sendMail({
      from: `Aether <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Your weekly business snapshot — ${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`,
      html,
    })

    logger.info({ event: 'weekly_email_sent', userId: user._id })
  } catch (err) {
    logger.error({ event: 'weekly_email_error', error: err.message })
  }
}