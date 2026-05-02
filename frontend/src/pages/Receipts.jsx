import { useState, useEffect, useRef } from 'react'
import { Plus, FileText, Check, Edit2, Trash2, X } from 'lucide-react'
import api from '../api/axios'
import ReceiptScanner from '../components/ReceiptScanner'

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

const formatCurrency = (amount) =>
  `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

const Receipts = () => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    vendor: '', amount: '', date: new Date().toISOString().split('T')[0],
    category: 'Miscellaneous', description: '', linkedClient: ''
  })
  const [editForm, setEditForm] = useState({})
  const [filters, setFilters] = useState({
    category: '', source: '', confirmed: '', dateFrom: '', dateTo: ''
  })
  const [sortBy, setSortBy] = useState('date-desc')

  useEffect(() => { fetchExpenses() }, [])

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.source) params.append('source', filters.source)
      if (filters.confirmed !== '') params.append('confirmed', filters.confirmed)
      const { data } = await api.get(`/expenses?${params}`)

      // Client-side date filter and sort
      let filtered = data
      if (filters.dateFrom) filtered = filtered.filter(e => new Date(e.date) >= new Date(filters.dateFrom))
      if (filters.dateTo) filtered = filtered.filter(e => new Date(e.date) <= new Date(filters.dateTo))

      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date)
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date)
        if (sortBy === 'amount-desc') return b.amount - a.amount
        if (sortBy === 'amount-asc') return a.amount - b.amount
        return 0
      })

      setExpenses(sorted)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  
  useEffect(() => { fetchExpenses() }, [filters, sortBy])
  
  const handleScanComplete = async (result) => {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/expenses/from-ocr', {
        vendor: result.vendor,
        amount: result.amount,
        date: result.date,
        category: result.category,
        description: result.description,
        receiptUrl: result.receiptUrl,
        userCategory: result.category,
      })
      setExpenses(prev => [data, ...prev])
      setShowScanner(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!form.amount || !form.date) return setError('Amount and date are required')
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/expenses', { ...form, amount: Number(form.amount) })
      setExpenses(prev => [data, ...prev])
      setShowManual(false)
      setForm({ vendor: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Miscellaneous', description: '', linkedClient: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (id) => {
    try {
      const { data } = await api.put(`/expenses/${id}`, editForm)
      setExpenses(prev => prev.map(e => e._id === id ? data : e))
      setEditingId(null)
    } catch (err) {
      setError('Failed to update')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`)
      setExpenses(prev => prev.filter(e => e._id !== id))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Receipts & Expenses
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setShowManual(true); setShowScanner(false) }}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Manual entry
          </button>
          <button
            onClick={() => { setShowScanner(true); setShowManual(false) }}
            style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', fontSize: 13, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Scan receipt
          </button>
        </div>
      </div>

      
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 12, outline: 'none' }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filters.source} onChange={e => setFilters({ ...filters, source: e.target.value })}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 12, outline: 'none' }}>
          <option value="">All sources</option>
          <option value="ocr">Scanned</option>
          <option value="manual">Manual</option>
        </select>

        <select value={filters.confirmed} onChange={e => setFilters({ ...filters, confirmed: e.target.value })}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 12, outline: 'none' }}>
          <option value="">All statuses</option>
          <option value="true">Confirmed</option>
          <option value="false">Pending review</option>
        </select>

        <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 12, outline: 'none' }} />

        <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 12, outline: 'none' }} />

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: 12, outline: 'none', marginLeft: 'auto' }}>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </select>

        {(filters.category || filters.source || filters.confirmed !== '' || filters.dateFrom || filters.dateTo) && (
          <button onClick={() => setFilters({ category: '', source: '', confirmed: '', dateFrom: '', dateTo: '' })}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-danger)', backgroundColor: 'transparent', fontSize: 12, color: 'var(--color-danger)', cursor: 'pointer' }}>
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      

      {/* Scanner */}
      {showScanner && (
        <div style={{ marginBottom: 24 }}>
          <ReceiptScanner
            mode="expense"
            onComplete={handleScanComplete}
            onCancel={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* Manual entry */}
      {showManual && (
        <div style={{ marginBottom: 24, padding: 20, borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Manual entry</h3>
            <button onClick={() => setShowManual(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Vendor', key: 'vendor', type: 'text', placeholder: 'EKEDC' },
              { label: 'Amount (₦)', key: 'amount', type: 'number', placeholder: '15000' },
              { label: 'Date', key: 'date', type: 'date' },
              { label: 'Linked client', key: 'linkedClient', type: 'text', placeholder: 'Optional' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={inputStyle} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Office supplies" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setShowManual(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleManualSubmit} disabled={submitting} style={{ flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', fontSize: 13, color: 'white', cursor: 'pointer', fontWeight: 600 }}>
              {submitting ? 'Saving...' : 'Post expense'}
            </button>
          </div>
        </div>
      )}

      {/* Expenses table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : expenses.length === 0 ? (
        <div style={{ borderRadius: 12, padding: '60px 20px', textAlign: 'center', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
          <FileText size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No expenses yet. Scan a receipt or add manually.</p>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                {['Date', 'Vendor', 'Category', 'Amount', 'Source', 'Status', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => (
                <tr key={exp._id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  {editingId === exp._id ? (
                    <td colSpan={7} style={{ padding: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
                        <input value={editForm.vendor || ''} onChange={e => setEditForm({ ...editForm, vendor: e.target.value })} placeholder="Vendor" style={{ ...inputStyle, width: 'auto' }} />
                        <input type="number" value={editForm.amount || ''} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} placeholder="Amount" style={{ ...inputStyle, width: 'auto' }} />
                        <input type="date" value={editForm.date?.split('T')[0] || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={{ ...inputStyle, width: 'auto' }} />
                        <select value={editForm.category || 'Miscellaneous'} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={{ ...inputStyle, width: 'auto' }}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditingId(null)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Cancel</button>
                        <button onClick={() => handleUpdate(exp._id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', backgroundColor: 'var(--color-primary)', fontSize: 12, color: 'white', cursor: 'pointer' }}>Save</button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{exp.date ? new Date(exp.date).toLocaleDateString('en-NG') : '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{exp.vendor || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{exp.category}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatCurrency(exp.amount)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{exp.source}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {exp.confirmed
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-success)' }}><Check size={12} /> Confirmed</span>
                          : <span style={{ fontSize: 12, color: 'var(--color-warning)' }}>Pending</span>
                        }
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setEditingId(exp._id); setEditForm({ ...exp, date: exp.date?.split('T')[0] }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(exp._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default Receipts