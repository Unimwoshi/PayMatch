import { useEffect, useState } from 'react'
import api from '../api/axios'
import { Plus, X, Paperclip, CheckCircle } from 'lucide-react'
import ReceiptScanner from '../components/ReceiptScanner'

const formatNaira = (amount) => {
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`
  return `₦${amount}`
}

const statusColors = {
  unmatched: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
  partial: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  matched: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
}

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [form, setForm] = useState({
    customerName: '', amount: '', paymentDate: '',
    narration: '', reference: '', source: 'manual', invoice: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/payments'),
      api.get('/invoices')
    ]).then(([pRes, iRes]) => {
      setPayments(pRes.data)
      setInvoices(iRes.data.filter(i => i.status !== 'paid'))
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value }
    // Auto-fill customer name when invoice is selected
    if (e.target.name === 'invoice') {
      const inv = invoices.find(i => i._id === e.target.value)
      if (inv) {
        updated.customerName = inv.customerName
        updated.amount = inv.remainingBalance
      }
    }
    setForm(updated)
  }

  const handleScanComplete = (result) => {
    setReceiptData(result)
    setShowScanner(false)
    // Pre-fill amount from receipt if not already set
    if (!form.amount && result.amount) {
      setForm(prev => ({ ...prev, amount: result.amount }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        invoice: form.invoice || null,
        ...(receiptData ? {
          receiptUrl: receiptData.receiptUrl,
          receiptExtractedAmount: receiptData.receiptExtractedAmount,
          receiptConfidence: receiptData.confidence,
          receiptConfirmed: receiptData.receiptConfirmed,
          receiptMismatch: receiptData.receiptMismatch,
          source: 'receipt',
        } : {})
      }
      const { data } = await api.post('/payments', payload)
      setPayments(prev => [data, ...prev])
      setShowModal(false)
      setForm({ customerName: '', amount: '', paymentDate: '', narration: '', reference: '', source: 'manual', invoice: '' })
      setReceiptData(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedInvoice = invoices.find(i => i._id === form.invoice)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Payments</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{payments.length} total payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={15} /> Record payment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)' }} />
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl p-16 text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No payments yet. Record your first one.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Customer', 'Amount', 'Date', 'Reference', 'Source', 'Receipt', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((pay, i) => (
                  <tr key={pay._id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{pay.customerName}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-primary)' }}>{formatNaira(pay.amount)}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{new Date(pay.paymentDate).toLocaleDateString('en-NG')}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{pay.reference || '—'}</td>
                    <td className="px-5 py-4 text-sm capitalize" style={{ color: 'var(--color-text-muted)' }}>{pay.source.replace('_', ' ')}</td>
                    <td className="px-5 py-4">
                      {pay.receiptUrl ? (
                        <a href={pay.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: pay.receiptMismatch ? 'var(--color-warning)' : 'var(--color-success)' }}>
                            {pay.receiptMismatch ? '⚠ Mismatch' : <><CheckCircle size={12} /> Verified</>}
                          </span>
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                        style={{ color: statusColors[pay.status]?.color, backgroundColor: statusColors[pay.status]?.bg }}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Record payment</h2>
              <button onClick={() => { setShowModal(false); setReceiptData(null); setShowScanner(false) }}>
                <X size={18} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              {/* Invoice selector */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Link to invoice (optional)
                </label>
                <select name="invoice" value={form.invoice} onChange={handleChange} style={inputStyle}>
                  <option value="">— Select invoice —</option>
                  {invoices.map(inv => (
                    <option key={inv._id} value={inv._id}>
                      {inv.customerName} — {inv.invoiceNumber ? `#${inv.invoiceNumber}` : 'No number'} — {formatNaira(inv.remainingBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Customer name', name: 'customerName', type: 'text', placeholder: 'Dangote Cement', required: true },
                { label: 'Amount (₦)', name: 'amount', type: 'number', placeholder: '150000', required: true },
                { label: 'Payment date', name: 'paymentDate', type: 'date', required: true },
                { label: 'Reference', name: 'reference', type: 'text', placeholder: 'TRF123456789' },
                { label: 'Narration', name: 'narration', type: 'text', placeholder: 'Payment for INV-001' },
              ].map(({ label, name, type, placeholder, required }) => (
                <div key={name}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
                  <input type={type} name={name} value={form[name]} onChange={handleChange}
                    placeholder={placeholder} required={required} style={inputStyle} />
                </div>
              ))}

              {/* Receipt attachment */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Payment proof (optional)
                </label>
                {receiptData ? (
                  <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={14} color="var(--color-success)" />
                      <span style={{ fontSize: 12, color: 'var(--color-success)' }}>
                        Receipt attached {receiptData.receiptMismatch ? '⚠ amount mismatch' : '— amounts match'}
                      </span>
                    </div>
                    <button type="button" onClick={() => setReceiptData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : showScanner ? (
                  <ReceiptScanner
                    mode="payment"
                    expectedAmount={form.amount ? Number(form.amount) : selectedInvoice?.remainingBalance}
                    onComplete={handleScanComplete}
                    onCancel={() => setShowScanner(false)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px dashed var(--color-border)', backgroundColor: 'transparent', fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Paperclip size={13} /> Attach receipt proof
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setReceiptData(null); setShowScanner(false) }}
                  className="flex-1 py-2.5 rounded-lg text-sm"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {submitting ? 'Saving...' : 'Record payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments