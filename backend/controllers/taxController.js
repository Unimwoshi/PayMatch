import Invoice from '../models/Invoice.js'
import Payment from '../models/Payment.js'
import Expense from '../models/Expense.js'
import PDFDocument from 'pdfkit'
import {Parser} from '@json2csv/plainjs'

const getPeriodBoundaries = (period, from, to) => {
  const now = new Date()
  if (period === 'custom' && from && to) {
    return { start: new Date(from), end: new Date(to) }
  }
  if (period === 'monthly') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }
  }
  if (period === 'quarterly') {
    const q = Math.floor(now.getMonth() / 3)
    return {
      start: new Date(now.getFullYear(), q * 3, 1),
      end: new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59)
    }
  }
  // annually
  return {
    start: new Date(now.getFullYear(), 0, 1),
    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
  }
}

export const getTaxSummary = async (req, res) => {
  try {
    const { period = 'monthly', from, to } = req.query
    const { start, end } = getPeriodBoundaries(period, from, to)
    const userId = req.user._id

    const invoices = await Invoice.find({
      user: userId,
      issueDate: { $gte: start, $lte: end }
    })

    const payments = await Payment.find({
      user: userId,
      paymentDate: { $gte: start, $lte: end }
    })

    const expenses = await Expense.find({
      user: userId,
      confirmed: true,
      date: { $gte: start, $lte: end }
    })

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalVATCollected = invoices
      .filter(inv => inv.vatEnabled)
      .reduce((sum, inv) => sum + (inv.vatAmount || 0), 0)
    const totalWHT = invoices
      .filter(inv => inv.whtEnabled)
      .reduce((sum, inv) => sum + (inv.whtAmount || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const netProfit = totalRevenue - totalExpenses
    const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    res.json({
      period, start, end,
      totalRevenue,
      totalReceived,
      totalVATCollected,
      totalWHT,
      totalExpenses,
      netProfit,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const exportTaxPDF = async (req, res) => {
  try {
    const { period = 'monthly', from, to } = req.query
    const { start, end } = getPeriodBoundaries(period, from, to)
    const userId = req.user._id

    const invoices = await Invoice.find({ user: userId, issueDate: { $gte: start, $lte: end } })
    const expenses = await Expense.find({ user: userId, confirmed: true, date: { $gte: start, $lte: end } })

    const totalRevenue = invoices.reduce((sum, i) => sum + (i.amount || 0), 0)
    const totalVAT = invoices.filter(i => i.vatEnabled).reduce((sum, i) => sum + (i.vatAmount || 0), 0)
    const totalWHT = invoices.filter(i => i.whtEnabled).reduce((sum, i) => sum + (i.whtAmount || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const netProfit = totalRevenue - totalExpenses

    const fmt = (n) => `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-NG')

    const doc = new PDFDocument({ size: 'A4', margin: 48 })
    const buffers = []
    doc.on('data', chunk => buffers.push(chunk))
    doc.on('end', () => {
      const pdf = Buffer.concat(buffers)
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tax-summary-${period}.pdf"`,
        'Content-Length': pdf.length,
      })
      res.send(pdf)
    })

    // Header
    doc.rect(0, 0, 595, 80).fill('#111827')
    doc.fontSize(20).font('Helvetica-Bold').fillColor('white')
    doc.text('TAX SUMMARY REPORT', 48, 28)
    doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.7)')
    doc.text(`Period: ${fmtDate(start)} — ${fmtDate(end)}`, 48, 54)

    let y = 110
    const row = (label, value, bold = false) => {
      doc.fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#111827')
      doc.text(label, 48, y)
      doc.text(value, 400, y, { width: 147, align: 'right' })
      y += 24
    }

    const divider = () => {
      doc.moveTo(48, y).lineTo(547, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke()
      y += 12
    }

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827')
    doc.text('Revenue', 48, y); y += 28
    divider()
    row('Total Revenue (all invoices)', fmt(totalRevenue))
    row('Total VAT Collected', fmt(totalVAT))
    row('Withholding Tax Deducted', fmt(totalWHT))
    y += 8; divider()

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827')
    doc.text('Expenses', 48, y); y += 28
    divider()
    row('Total Business Expenses', fmt(totalExpenses))
    y += 8; divider()

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827')
    doc.text('Summary', 48, y); y += 28
    divider()
    row('Net Profit (Revenue − Expenses)', fmt(netProfit), true)
    y += 8; divider()

    // Disclaimer
    y += 20
    doc.rect(48, y, 499, 50).fill('#FEF3C7')
    doc.fontSize(8).font('Helvetica').fillColor('#92400E')
    doc.text('This report is generated for reference purposes only. Please consult a qualified accountant for official tax filing with FIRS.', 58, y + 10, { width: 479 })

    doc.end()
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const exportTaxCSV = async (req, res) => {
  try {
    const { period = 'monthly', from, to } = req.query
    const { start, end } = getPeriodBoundaries(period, from, to)
    const userId = req.user._id

    const invoices = await Invoice.find({ user: userId, issueDate: { $gte: start, $lte: end } })
    const expenses = await Expense.find({ user: userId, confirmed: true, date: { $gte: start, $lte: end } })

    const invoiceRows = invoices.map(inv => ({
      type: 'Invoice',
      date: new Date(inv.issueDate).toLocaleDateString('en-NG'),
      description: `Invoice #${inv.invoiceNumber || 'N/A'} — ${inv.customerName}`,
      amount: inv.amount,
      vat: inv.vatEnabled ? inv.vatAmount : 0,
      wht: inv.whtEnabled ? inv.whtAmount : 0,
      category: 'Revenue',
    }))

    const expenseRows = expenses.map(exp => ({
      type: 'Expense',
      date: new Date(exp.date).toLocaleDateString('en-NG'),
      description: `${exp.vendor || 'Unknown'} — ${exp.description || ''}`,
      amount: exp.amount,
      vat: 0,
      wht: 0,
      category: exp.category,
    }))

    const parser = new Parser({
      fields: ['type', 'date', 'description', 'amount', 'vat', 'wht', 'category']
    })
    const csv = parser.parse([...invoiceRows, ...expenseRows])

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tax-summary-${period}.csv"`,
    })
    res.send(csv)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}