import PDFDocument from 'pdfkit'

const COLORS = {
  primary: '#2563EB',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  light: '#F9FAFB',
}

const currencySymbol = (currency) => {
  const map = { NGN: '₦', USD: '$', GBP: '£', CNY: '¥' }
  return map[currency] || currency
}

const formatAmount = (amount, currency = 'NGN') => {
  const sym = currencySymbol(currency)
  return `${sym}${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Classic template — clean, professional, Nigerian SME focused
export const generateClassicPDF = (invoice, user, fieldPositions = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 })
      const buffers = []

      doc.on('data', chunk => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      const W = 595.28 // A4 width in points
      const margin = 48

      // If user has saved custom field positions, use those
      // Otherwise render the default classic layout
      if (fieldPositions && fieldPositions.length > 0) {
        renderWithPositions(doc, invoice, user, fieldPositions, W)
      } else {
        renderClassicLayout(doc, invoice, user, W, margin)
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

const renderClassicLayout = (doc, invoice, user, W, margin) => {
  let y = 0

  // ── Header band ──
  doc.rect(0, 0, W, 120).fill(COLORS.primary)

  // Business name
  doc.fontSize(22).fillColor('white').font('Helvetica-Bold')
  doc.text(user.businessName || 'Your Business', margin, 36, { width: 280 })

  // Business details (right side of header)
  doc.fontSize(8).font('Helvetica').fillColor('rgba(255,255,255,0.85)')
  const bizDetails = [
    user.businessDetails?.address,
    user.businessDetails?.phone,
    user.email,
  ].filter(Boolean)
  doc.text(bizDetails.join('\n'), W - margin - 180, 36, { width: 180, align: 'right' })

  // Logo (if exists) — top right corner inside band
  // Logo is loaded async before calling this function if available

  y = 140

  // ── INVOICE label + number ──
  doc.fontSize(28).font('Helvetica-Bold').fillColor(COLORS.text)
  doc.text('INVOICE', margin, y)

  doc.fontSize(10).font('Helvetica').fillColor(COLORS.muted)
  doc.text(`#${invoice.invoiceNumber || 'N/A'}`, margin, y + 34)

  // ── Invoice meta (right side) ──
  const metaX = W - margin - 180
  const metaItems = [
    { label: 'Issue Date', value: formatDate(invoice.issueDate) },
    { label: 'Due Date', value: formatDate(invoice.dueDate) },
    { label: 'Status', value: (invoice.status || 'unpaid').toUpperCase() },
  ]

  metaItems.forEach((item, i) => {
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
    doc.text(item.label, metaX, y + (i * 18), { width: 80 })
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
    doc.text(item.value, metaX + 85, y + (i * 18), { width: 95, align: 'right' })
  })

  y += 70

  // ── Divider ──
  doc.moveTo(margin, y).lineTo(W - margin, y).lineWidth(1).strokeColor(COLORS.border).stroke()
  y += 20

  // ── Bill To ──
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
  doc.text('BILL TO', margin, y)
  y += 14

  doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.text)
  doc.text(invoice.customerName, margin, y)
  y += 16

  if (invoice.customerAddress || invoice.customerEmail || invoice.customerPhone) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
    const clientDetails = [
      invoice.customerAddress,
      invoice.customerEmail,
      invoice.customerPhone
    ].filter(Boolean)
    doc.text(clientDetails.join('  ·  '), margin, y, { width: 350 })
    y += 14 * clientDetails.length
  }

  y += 24

  // ── Line items table ──
  // Table header
  doc.rect(margin, y, W - margin * 2, 24).fill(COLORS.light)

  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.muted)
  doc.text('DESCRIPTION', margin + 10, y + 8)
  doc.text('QTY', W - margin - 220, y + 8, { width: 50, align: 'center' })
  doc.text('UNIT PRICE', W - margin - 165, y + 8, { width: 80, align: 'right' })
  doc.text('SUBTOTAL', W - margin - 80, y + 8, { width: 80, align: 'right' })

  y += 24

  // Table rows
  const lineItems = invoice.lineItems || []
  lineItems.forEach((item, i) => {
    const rowH = 28
    if (i % 2 === 1) {
      doc.rect(margin, y, W - margin * 2, rowH).fill('#FAFAFA')
    }

    const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)

    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
    doc.text(item.description || '—', margin + 10, y + 9, { width: 220 })

    doc.text(String(item.quantity || 1), W - margin - 220, y + 9, { width: 50, align: 'center' })

    doc.text(formatAmount(item.unitPrice, invoice.currency), W - margin - 165, y + 9, { width: 80, align: 'right' })

    doc.font('Helvetica-Bold')
    doc.text(formatAmount(subtotal, invoice.currency), W - margin - 80, y + 9, { width: 80, align: 'right' })

    y += rowH
  })

  // Table bottom border
  doc.moveTo(margin, y).lineTo(W - margin, y).lineWidth(0.5).strokeColor(COLORS.border).stroke()
  y += 20

  // ── Totals ──
  const totalsX = W - margin - 220

  const totalsRows = [
    { label: 'Subtotal', value: formatAmount(invoice.subtotal, invoice.currency) },
  ]

  if (invoice.discount > 0) {
    const discLabel = invoice.discountType === 'percentage'
      ? `Discount (${invoice.discount}%)`
      : 'Discount'
    totalsRows.push({ label: discLabel, value: `− ${formatAmount(invoice.discountAmount || 0, invoice.currency)}` })
  }

  if (invoice.vatEnabled) {
    totalsRows.push({ label: `VAT (${invoice.vatRate}%)`, value: formatAmount(invoice.vatAmount, invoice.currency) })
  }

  if (invoice.whtEnabled) {
    totalsRows.push({ label: `WHT (${invoice.whtRate}%)`, value: `− ${formatAmount(invoice.whtAmount, invoice.currency)}` })
  }

  totalsRows.forEach(row => {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
    doc.text(row.label, totalsX, y, { width: 110 })
    doc.font('Helvetica').fillColor(COLORS.text)
    doc.text(row.value, totalsX + 115, y, { width: 95, align: 'right' })
    y += 18
  })

  // Grand total
  y += 4
  doc.rect(totalsX - 10, y - 6, 220, 30).fill(COLORS.primary)
  doc.fontSize(11).font('Helvetica-Bold').fillColor('white')
  doc.text('TOTAL', totalsX, y + 4, { width: 110 })
  doc.text(formatAmount(invoice.amount, invoice.currency), totalsX + 115, y + 4, { width: 95, align: 'right' })

  y += 44

  // ── Bank details ──
  if (invoice.bankName || invoice.accountNumber) {
    doc.rect(margin, y, W - margin * 2, 70).fill(COLORS.light)

    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.muted)
    doc.text('PAYMENT DETAILS', margin + 14, y + 12)

    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
    const bankLines = [
      invoice.bankName && `Bank: ${invoice.bankName}`,
      invoice.accountNumber && `Account Number: ${invoice.accountNumber}`,
      invoice.accountName && `Account Name: ${invoice.accountName}`,
    ].filter(Boolean)

    bankLines.forEach((line, i) => {
      doc.text(line, margin + 14, y + 26 + (i * 14))
    })

    y += 84
  }

  // ── Notes ──
  if (invoice.notes) {
    y += 8
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.muted)
    doc.text('NOTES / PAYMENT TERMS', margin, y)
    y += 12
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
    doc.text(invoice.notes, margin, y, { width: W - margin * 2 })
    y += 30
  }

  // ── Footer ──
  const footerY = 800
  doc.moveTo(margin, footerY).lineTo(W - margin, footerY).lineWidth(0.5).strokeColor(COLORS.border).stroke()
  doc.fontSize(7).font('Helvetica').fillColor(COLORS.muted)
  doc.text('Powered by Aether', margin, footerY + 8, { width: W - margin * 2, align: 'center' })
}

// For custom field positions (drag-drop saved layout)
const renderWithPositions = (doc, invoice, user, fieldPositions, W) => {
  // White background
  doc.rect(0, 0, W, 842).fill('white')

  const fieldValues = {
    businessName: user.businessName || '',
    businessAddress: user.businessDetails?.address || '',
    businessPhone: user.businessDetails?.phone || '',
    businessEmail: user.email || '',
    invoiceNumber: `#${invoice.invoiceNumber || 'N/A'}`,
    issueDate: formatDate(invoice.issueDate),
    dueDate: formatDate(invoice.dueDate),
    customerName: invoice.customerName || '',
    customerAddress: invoice.customerAddress || '',
    customerEmail: invoice.customerEmail || '',
    customerPhone: invoice.customerPhone || '',
    subtotal: formatAmount(invoice.subtotal, invoice.currency),
    vatAmount: invoice.vatEnabled ? formatAmount(invoice.vatAmount, invoice.currency) : '',
    whtAmount: invoice.whtEnabled ? formatAmount(invoice.whtAmount, invoice.currency) : '',
    total: formatAmount(invoice.amount, invoice.currency),
    bankName: invoice.bankName || '',
    accountNumber: invoice.accountNumber || '',
    accountName: invoice.accountName || '',
    notes: invoice.notes || '',
  }

  fieldPositions.forEach(field => {
    const value = fieldValues[field.key] || ''
    if (!value) return

    doc
      .fontSize(field.fontSize || 10)
      .font(field.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(COLORS.text)
      .text(value, field.x, field.y, {
        width: field.width || 200,
        align: field.align || 'left',
      })
  })

  // Always render line items table in a sensible default position
  // unless a specific position override exists
  const tableField = fieldPositions.find(f => f.key === 'lineItemsTable')
  const tableY = tableField ? tableField.y : 400
  const tableX = tableField ? tableField.x : 48

  renderLineItemsTable(doc, invoice, tableX, tableY, W)
}

const renderLineItemsTable = (doc, invoice, x, y, W) => {
  const margin = x
  const tableW = W - margin * 2

  doc.rect(margin, y, tableW, 24).fill(COLORS.light)
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.muted)
  doc.text('DESCRIPTION', margin + 10, y + 8)
  doc.text('QTY', W - margin - 220, y + 8, { width: 50, align: 'center' })
  doc.text('UNIT PRICE', W - margin - 165, y + 8, { width: 80, align: 'right' })
  doc.text('SUBTOTAL', W - margin - 80, y + 8, { width: 80, align: 'right' })

  y += 24
  const lineItems = invoice.lineItems || []
  lineItems.forEach((item, i) => {
    if (i % 2 === 1) doc.rect(margin, y, tableW, 28).fill('#FAFAFA')
    const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
    doc.fontSize(9).font('Helvetica').fillColor('#111827')
    doc.text(item.description || '—', margin + 10, y + 9, { width: 220 })
    doc.text(String(item.quantity || 1), W - margin - 220, y + 9, { width: 50, align: 'center' })
    doc.text(formatAmount(item.unitPrice, invoice.currency), W - margin - 165, y + 9, { width: 80, align: 'right' })
    doc.font('Helvetica-Bold').text(formatAmount(subtotal, invoice.currency), W - margin - 80, y + 9, { width: 80, align: 'right' })
    y += 28
  })
}