// components/ReceiptScanner.jsx
import { useState, useRef } from 'react'
import {createWorker} from 'tesseract.js'
import { Upload, AlertTriangle, CheckCircle, Edit2 } from 'lucide-react'

const CATEGORIES = [
  'Rent & Utilities', 'Salaries & Wages', 'Logistics & Delivery',
  'Cost of Goods Sold', 'Raw Materials', 'Marketing & Advertising',
  'Professional Services', 'Equipment & Maintenance',
  'Travel & Transportation', 'Miscellaneous',
]

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

// Client-side vendor classifier
const classifyVendor = (text) => {
  const lower = (text || '').toLowerCase()
  const rules = [
    { patterns: ['ekedc', 'ikedc', 'aedc', 'electric', 'water board', 'lawma'], category: 'Rent & Utilities' },
    { patterns: ['dhl', 'gig', 'nipost', 'fedex', 'kwik', 'sendbox'], category: 'Logistics & Delivery' },
    { patterns: ['shoprite', 'justrite', 'spar', 'market', 'supermarket'], category: 'Cost of Goods Sold' },
    { patterns: ['dangote', 'cement', 'building material', 'iron rod'], category: 'Raw Materials' },
    { patterns: ['salary', 'wages', 'payroll'], category: 'Salaries & Wages' },
    { patterns: ['google ads', 'meta ads', 'facebook', 'printing', 'flyer'], category: 'Marketing & Advertising' },
    { patterns: ['lawyer', 'accountant', 'consultant', 'audit', 'legal'], category: 'Professional Services' },
    { patterns: ['uber', 'bolt', 'fuel', 'petrol', 'diesel', 'transport', 'flight'], category: 'Travel & Transportation' },
    { patterns: ['generator', 'repair', 'maintenance', 'laptop', 'equipment'], category: 'Equipment & Maintenance' },
  ]
  for (const rule of rules) {
    for (const p of rule.patterns) {
      if (lower.includes(p)) return { category: rule.category, confidence: 85 }
    }
  }
  return { category: 'Miscellaneous', confidence: 0 }
}

const parseReceiptText = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let amount = ''
  const amountPatterns = [
    /(?:total|amount|grand total|sum)[:\s]*[₦$]?\s*([\d,]+\.?\d*)/i,
    /[₦$]\s*([\d,]+\.?\d*)/,
    /([\d,]+\.\d{2})/,
  ]
  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) { amount = match[1].replace(/,/g, ''); break }
  }
  let date = ''
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/i,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/,
  ]
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      const parsed = new Date(match[1])
      if (!isNaN(parsed)) { date = parsed.toISOString().split('T')[0]; break }
    }
  }
  const vendor = lines[0] || ''
  const { category, confidence } = classifyVendor(vendor + ' ' + lines.slice(0, 3).join(' '))
  return { vendor, amount, date, category, confidence, description: lines.slice(1, 3).join(' ') }
}

const confidenceBadge = (c) => {
  if (c >= 70) return { color: 'var(--color-success)', bg: 'var(--color-success-bg)', label: `${c}% confident` }
  if (c >= 40) return { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', label: `${c}% — please verify` }
  return { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', label: 'Low confidence — enter manually' }
}

// mode: 'expense' | 'payment'
// onComplete(result) — called when user confirms
// expectedAmount — for payment mode, the invoice amount to cross-check against
const ReceiptScanner = ({ mode = 'expense', onComplete, onCancel, expectedAmount = null }) => {
  const fileRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanned, setScanned] = useState(null)
  const [form, setForm] = useState({
    vendor: '', amount: '', date: new Date().toISOString().split('T')[0],
    category: 'Miscellaneous', description: '',
  })
  const [mismatch, setMismatch] = useState(null) // { extracted, expected }
  const [receiptUrl, setReceiptUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setScanning(true)
    setProgress(0)
    setMismatch(null)

    try {
      // Upload file first
      setUploading(true)
      const fd = new FormData()
      fd.append('receipt', file)

      // Dynamic import to avoid circular deps
      const api = (await import('../api/axios')).default
      const { data: uploadData } = await api.post('/expenses/receipt', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setReceiptUrl(uploadData.receiptUrl)
      setUploading(false)

      // Run Tesseract
      const worker = await createWorker('eng', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
        logger: m => {
            if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100))
            }
        }
        })
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      const parsed = parseReceiptText(text)
      setScanned(parsed)
      setForm({
        vendor: parsed.vendor || '',
        amount: parsed.amount || '',
        date: parsed.date || new Date().toISOString().split('T')[0],
        category: parsed.category || 'Miscellaneous',
        description: parsed.description || '',
      })

      // Payment mode — check for amount mismatch
      if (mode === 'payment' && expectedAmount && parsed.amount) {
        const extracted = Number(parsed.amount)
        const diff = Math.abs(extracted - expectedAmount) / expectedAmount
        if (diff > 0.05) {
          setMismatch({ extracted, expected: expectedAmount })
        }
      }
    } catch (err) {
      console.error('OCR error:', err)
    } finally {
      setScanning(false)
    }
  }

  const handleConfirm = () => {
    onComplete({
      ...form,
      amount: Number(form.amount),
      receiptUrl,
      confidence: scanned?.confidence || 0,
      receiptExtractedAmount: scanned?.amount ? Number(scanned.amount) : null,
      receiptMismatch: !!mismatch,
      receiptConfirmed: true,
    })
  }

  const badge = scanned ? confidenceBadge(scanned.confidence) : null

  return (
    <div style={{
      borderRadius: 12, border: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-bg-card)', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {mode === 'expense' ? 'Scan receipt' : 'Attach payment proof'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
            {mode === 'expense'
              ? 'Upload a receipt to log this expense'
              : 'Upload proof to verify this payment'}
          </p>
        </div>
        {badge && (
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {/* Upload trigger */}
        {!scanned && !scanning && (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--color-border)', borderRadius: 10,
              padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
              backgroundColor: 'var(--color-bg)',
            }}
          >
            <Upload size={24} color="var(--color-text-muted)" style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Click to upload receipt
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
              JPG, PNG or PDF — max 5MB
            </p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf"
          onChange={handleFile} style={{ display: 'none' }} />

        {/* Scanning progress */}
        {scanning && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
                {uploading ? 'Uploading...' : `Scanning... ${progress}%`}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--color-primary)', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Mismatch warning — payment mode */}
        {mismatch && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', display: 'flex', gap: 10 }}>
            <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Amount mismatch</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Receipt shows <strong>₦{mismatch.extracted.toLocaleString()}</strong> but invoice amount is <strong>₦{mismatch.expected.toLocaleString()}</strong>. Confirm which is correct before proceeding.
              </p>
            </div>
          </div>
        )}

        {/* Low confidence warning */}
        {scanned && scanned.confidence < 40 && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-danger-bg)', display: 'flex', gap: 10 }}>
            <Edit2 size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-danger)' }}>
              OCR couldn't read this receipt clearly. Please fill in the details manually.
            </p>
          </div>
        )}

        {/* Scanned fields — review form */}
        {scanned && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {mode === 'expense' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vendor</label>
                  <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} style={inputStyle} />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Amount (₦)
                  {scanned.confidence >= 40 && scanned.confidence < 70 && (
                    <span style={{ marginLeft: 6, color: 'var(--color-warning)' }}>⚠ verify</span>
                  )}
                </label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ ...inputStyle, borderColor: scanned.confidence < 70 ? 'var(--color-warning)' : 'var(--color-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
              </div>
            </div>

            {mode === 'expense' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                onClick={onCancel}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', fontSize: 13, color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <CheckCircle size={14} />
                {mode === 'expense' ? 'Confirm & post expense' : 'Confirm payment proof'}
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default ReceiptScanner