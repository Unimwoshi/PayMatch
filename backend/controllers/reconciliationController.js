import Invoice from '../models/Invoice.js'
import Payment from '../models/Payment.js'
import Expense from '../models/Expense.js'
import ReconciliationMatch from '../models/ReconciliationMatch.js'
import Fuse from 'fuse.js'
import notify from '../utils/notify.js'

const getNameScore = (invoiceName, paymentName) => {
  const fuse = new Fuse([invoiceName], { threshold: 0.6, includeScore: true })
  const result = fuse.search(paymentName)
  if (result.length === 0) return 0
  return Math.round((1 - result[0].score) * 100)
}

const getDateScore = (invoiceDueDate, paymentDate) => {
  if (!invoiceDueDate) return 50
  const diffDays = Math.abs(
    (new Date(paymentDate) - new Date(invoiceDueDate)) / (1000 * 60 * 60 * 24)
  )
  if (diffDays === 0) return 100
  if (diffDays <= 3) return 80
  if (diffDays <= 7) return 60
  if (diffDays <= 14) return 40
  return 10
}

const getAmountScore = (invoiceAmount, paymentAmount) => {
  if (invoiceAmount === paymentAmount) return 100
  const diff = Math.abs(invoiceAmount - paymentAmount)
  const percentDiff = (diff / invoiceAmount) * 100
  if (percentDiff <= 1) return 90
  if (percentDiff <= 5) return 70
  if (percentDiff <= 10) return 50
  return 0
}

const getMatchStatus = (invoice, payment) => {
  if (payment.amount === invoice.amount) return 'paid'
  if (payment.amount < invoice.amount) return 'partial'
  if (payment.amount > invoice.amount) return 'overpaid'
}

const formatNaira = (amount) => {
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`
  return `₦${amount}`
}

export const runReconciliation = async (req, res) => {
  try {
    const userId = req.user._id

    const invoices = await Invoice.find({
      user: userId,
      status: { $in: ['unpaid', 'partial'] }
    })

    const payments = await Payment.find({
      user: userId,
      status: 'unmatched'
    })

    if (invoices.length === 0 || payments.length === 0) {
      return res.json({ message: 'No unmatched data to reconcile', matches: [] })
    }

    const matches = []

    for (const payment of payments) {
      let bestMatch = null
      let bestScore = 0

      for (const invoice of invoices) {
        const nameScore = getNameScore(invoice.customerName, payment.customerName)
        const amountScore = getAmountScore(invoice.remainingBalance, payment.amount)
        const dateScore = getDateScore(invoice.dueDate, payment.paymentDate)

        const totalScore = (amountScore * 0.5) + (nameScore * 0.35) + (dateScore * 0.15)

        if (totalScore > bestScore) {
          bestScore = totalScore
          bestMatch = invoice
        }
      }

      if (bestMatch && bestScore >= 40) {
        const matchStatus = getMatchStatus(bestMatch, payment)

        const match = await ReconciliationMatch.create({
          user: userId,
          invoice: bestMatch._id,
          payment: payment._id,
          matchedAmount: payment.amount,
          confidenceScore: Math.round(bestScore),
          matchType: 'auto',
          status: bestScore >= 70 ? 'confirmed' : 'pending_review'
        })

        const newBalance = bestMatch.remainingBalance - payment.amount
        await Invoice.findByIdAndUpdate(bestMatch._id, {
          status: matchStatus === 'overpaid' ? 'paid' : matchStatus,
          remainingBalance: newBalance <= 0 ? 0 : newBalance
        })

        await Payment.findByIdAndUpdate(payment._id, {
          status: matchStatus === 'partial' ? 'partial' : 'matched'
        })

        matches.push({
          matchId: match._id,
          invoice: {
            id: bestMatch._id,
            customerName: bestMatch.customerName,
            amount: bestMatch.amount,
            invoiceNumber: bestMatch.invoiceNumber
          },
          payment: {
            id: payment._id,
            customerName: payment.customerName,
            amount: payment.amount,
            reference: payment.reference
          },
          confidenceScore: Math.round(bestScore),
          status: match.status,
          matchStatus
        })
      }

      await notify(userId, {
      title: 'Match found',
      message: `${payment.customerName} — ${formatNaira(payment.amount)} matched to invoice ${bestMatch.invoiceNumber || ''}`,
      type: 'match_found',
      link: '/reconciliation'
      })
    }

    res.json({
      message: `Reconciliation complete. ${matches.length} match(es) found.`,
      matches
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getMatches = async (req, res) => {
  try {
    const matches = await ReconciliationMatch.find({ user: req.user._id })
      .populate('invoice', 'customerName amount invoiceNumber status')
      .populate('payment', 'customerName amount reference status')
      .sort({ createdAt: -1 })

    res.json(matches)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const confirmMatch = async (req, res) => {
  try {
    const match = await ReconciliationMatch.findById(req.params.id)

    if (!match) {
      return res.status(404).json({ message: 'Match not found' })
    }

    if (match.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    match.status = 'confirmed'
    match.matchType = 'manual'
    await match.save()

    res.json({ message: 'Match confirmed', match })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const rejectMatch = async (req, res) => {
  try {
    const match = await ReconciliationMatch.findById(req.params.id)

    if (!match) {
      return res.status(404).json({ message: 'Match not found' })
    }

    if (match.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    await Invoice.findByIdAndUpdate(match.invoice, {
      status: 'unpaid',
      remainingBalance: match.matchedAmount
    })

    await Payment.findByIdAndUpdate(match.payment, {
      status: 'unmatched'
    })

    await match.deleteOne()

    res.json({ message: 'Match rejected and reverted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id
    const now = new Date()

    // Current month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // ── Invoice stats ──────────────────────────────────────────────────
    const allInvoices = await Invoice.find({ user: userId })
    const totalInvoiced = allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalOutstanding = allInvoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.remainingBalance || 0), 0)

    const overdueInvoices = allInvoices
      .filter(inv => inv.dueDate && new Date(inv.dueDate) < now && inv.status !== 'paid')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map(inv => ({
        id: inv._id,
        customerName: inv.customerName,
        invoiceNumber: inv.invoiceNumber,
        remainingBalance: inv.remainingBalance,
        daysOverdue: Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)),
        currency: inv.currency,
      }))

    const invoiceCounts = {
      total: allInvoices.length,
      paid: allInvoices.filter(i => i.status === 'paid').length,
      partial: allInvoices.filter(i => i.status === 'partial').length,
      unpaid: allInvoices.filter(i => i.status === 'unpaid').length,
      overdue: overdueInvoices.length,
    }

    // ── Payment stats ──────────────────────────────────────────────────
    const allPayments = await Payment.find({ user: userId })
    const totalReceived = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const thisMonthReceived = allPayments
      .filter(p => new Date(p.paymentDate) >= monthStart && new Date(p.paymentDate) <= monthEnd)
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const paymentCounts = {
      total: allPayments.length,
      matched: allPayments.filter(p => p.status === 'matched').length,
      unmatched: allPayments.filter(p => p.status === 'unmatched').length,
    }

    // ── Expense stats ──────────────────────────────────────────────────
    const allExpenses = await Expense.find({ user: userId, confirmed: true })
    const thisMonthExpenses = allExpenses.filter(e =>
      new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd
    )
    const totalExpensesThisMonth = thisMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

    // Expense breakdown by category
    const expenseByCategory = thisMonthExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    }, {})
    const expenseCategoryData = Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Net cash position this month
    const netCashPosition = thisMonthReceived - totalExpensesThisMonth

    // ── 6-month breakdown ──────────────────────────────────────────────
    const sixMonthData = []
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const label = mStart.toLocaleString('en-NG', { month: 'short' })

      const income = allPayments
        .filter(p => new Date(p.paymentDate) >= mStart && new Date(p.paymentDate) <= mEnd)
        .reduce((sum, p) => sum + p.amount, 0)

      const expenses = allExpenses
        .filter(e => new Date(e.date) >= mStart && new Date(e.date) <= mEnd)
        .reduce((sum, e) => sum + e.amount, 0)

      sixMonthData.push({ month: label, income, expenses })
    }

    // ── Business Health Score ──────────────────────────────────────────
    let healthScore = 100
    let healthFactors = []

    // Factor 1: Invoice payment rate (40 points)
    const paymentRate = invoiceCounts.total > 0
      ? (invoiceCounts.paid / invoiceCounts.total) * 100 : 100
    const paymentPoints = Math.round((paymentRate / 100) * 40)
    healthFactors.push({ label: 'Invoice payment rate', score: paymentPoints, max: 40 })

    // Factor 2: Outstanding to revenue ratio (30 points)
    const outstandingRatio = totalInvoiced > 0
      ? totalOutstanding / totalInvoiced : 0
    const outstandingPoints = Math.round((1 - Math.min(outstandingRatio, 1)) * 30)
    healthFactors.push({ label: 'Outstanding ratio', score: outstandingPoints, max: 30 })

    // Factor 3: Expense consistency (30 points)
    const recentMonths = sixMonthData.slice(-3)
    const hasExpenseData = recentMonths.some(m => m.expenses > 0)
    const expensePoints = hasExpenseData
      ? Math.round((1 - Math.min(totalExpensesThisMonth / Math.max(thisMonthReceived, 1), 1)) * 30)
      : 30
    healthFactors.push({ label: 'Cash flow health', score: expensePoints, max: 30 })

    healthScore = paymentPoints + outstandingPoints + expensePoints

    const healthColor = healthScore >= 70 ? 'green' : healthScore >= 40 ? 'amber' : 'red'

    res.json({
      totalInvoiced,
      totalReceived,
      totalOutstanding,
      totalExpensesThisMonth,
      thisMonthReceived,
      netCashPosition,
      invoiceCounts,
      paymentCounts,
      overdueInvoices,
      expenseCategoryData,
      sixMonthData,
      healthScore,
      healthColor,
      healthFactors,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}