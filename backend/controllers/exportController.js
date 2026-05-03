import archiver from 'archiver'
import Invoice from '../models/Invoice.js'
import Payment from '../models/Payment.js'
import Expense from '../models/Expense.js'
import Customer from '../models/Customer.js'
import {Parser} from '@json2csv/plainjs'

export const exportAllData = async (req, res) => {
  try {
    const userId = req.user._id

    const [invoices, payments, expenses, customers] = await Promise.all([
      Invoice.find({ user: userId }),
      Payment.find({ user: userId }),
      Expense.find({ user: userId }),
      Customer.find({ user: userId }),
    ])

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="aether-export-${Date.now()}.zip"`,
    })

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)

    const toCSV = (data, fields) => {
      if (!data.length) return 'No data'
      const parser = new Parser({ fields })
      return parser.parse(data)
    }

    // Invoices CSV
    archive.append(
      toCSV(invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber || '',
        customerName: inv.customerName,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        issueDate: inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-NG') : '',
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-NG') : '',
        remainingBalance: inv.remainingBalance,
      })), ['invoiceNumber', 'customerName', 'amount', 'currency', 'status', 'issueDate', 'dueDate', 'remainingBalance']),
      { name: 'invoices.csv' }
    )

    // Payments CSV
    archive.append(
      toCSV(payments.map(p => ({
        customerName: p.customerName,
        amount: p.amount,
        paymentDate: new Date(p.paymentDate).toLocaleDateString('en-NG'),
        reference: p.reference || '',
        source: p.source,
        status: p.status,
      })), ['customerName', 'amount', 'paymentDate', 'reference', 'source', 'status']),
      { name: 'payments.csv' }
    )

    // Expenses CSV
    archive.append(
      toCSV(expenses.map(e => ({
        vendor: e.vendor || '',
        amount: e.amount,
        date: new Date(e.date).toLocaleDateString('en-NG'),
        category: e.category,
        description: e.description || '',
        source: e.source,
        confirmed: e.confirmed,
      })), ['vendor', 'amount', 'date', 'category', 'description', 'source', 'confirmed']),
      { name: 'expenses.csv' }
    )

    // Customers CSV
    archive.append(
      toCSV(customers.map(c => ({
        name: c.name,
        contactPerson: c.contactPerson || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        totalInvoiced: c.totalInvoiced,
        totalPaid: c.totalPaid,
        totalOutstanding: c.totalOutstanding,
        reliabilityScore: c.reliabilityScore,
      })), ['name', 'contactPerson', 'phone', 'email', 'address', 'totalInvoiced', 'totalPaid', 'totalOutstanding', 'reliabilityScore']),
      { name: 'customers.csv' }
    )

    await archive.finalize()
    await audit(req, 'export:data_exported', { metadata: { exportedAt: new Date() } })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}