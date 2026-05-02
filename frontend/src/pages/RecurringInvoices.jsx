import { useState, useEffect } from 'react'
import { Plus, X, Pause, Play, Trash2, RefreshCw } from 'lucide-react'
import api from '../api/axios'

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--color-text-muted)', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const frequencyLabel = {
  weekly: 'Every week', biweekly: 'Every 2 weeks',
  monthly: 'Every month', quarterly: 'Every quarter', annually: 'Every year',
}

const statusColors = {
  active: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  paused: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  cancelled: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
}

const RecurringInvoices = () => {
  const [recurring, setRecurring] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customerId: '', customerName: '', frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', autoSend: false, notes: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: '' }],
    vatEnabled: false, whtEnabled: false, currency: 'NGN',
  })

  useEffect(() => {
    Promise.all([
      api.get('/recurring'),
      api.get('/customers'),
    ]).then(([rRes, cRes]) => {
      setRecurring(rRes.data)
      setCustomers(cRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleCustomerSelect = (e) => {
    const c = customers.find(c => c._id === e.target.value)
    setForm(f => ({ ...f, customerId: e.target.value, customerName: c?.name || '' }))
  }

  const handleLineItem = (i, field, value) => {
    const items = [...form.lineItems]
    items[i] = { ...items[i], [field]: value }
    setForm(f => ({ ...f, lineItems: items }))
  }

  const handleSubmit = async () => {
    if (!form.customerName || !form.frequency || !form.startDate || !form.lineItems.some(i => i.description && i.unitPrice)) {
      return setError('Customer, frequency, start date and at least one line item are required')
    }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/recurring', {
        customer: form.customerId || null,
        customerName: form.customerName,
        lineItems: form.lineItems.filter(i => i.description && i.unitPrice).map(i => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice),
        })),
        vatEnabled: form.vatEnabled,
        whtEnabled: form.whtEnabled,
        currency: form.currency,
        notes: form.notes,
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || null,
        autoSend: form.autoSend,
      })
      setRecurring(prev => [data, ...prev])
      setShowModal(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStatus = async (rec) => {
    const newStatus = rec.status === 'active' ? 'paused' : 'active'
    try {
      const { data } = await api.put(`/recurring/${rec._id}`, { status: newStatus })
      setRecurring(prev => prev.map(r => r._id === rec._id ? data : r))
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/recurring/${id}`)
      setRecurring(prev => prev.filter(r => r._id !== id))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="p-4 md:p-8">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Recurring Invoices</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Set up automatic invoices for retainer clients
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          backgroundColor: 'var(--color-primary)', color: 'white',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Plus size={14} /> New schedule
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : recurring.length === 0 ? (
        <div style={{ borderRadius: 12, padding: '60px 20px', textAlign: 'center', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
          <RefreshCw size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            No recurring invoices yet. Set one up for a retainer client.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recurring.map(rec => {
            const sc = statusColors[rec.status]
            return (
              <div key={rec._id} style={{
                padding: 20, borderRadius: 12, border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {rec.customerName}
                    </p>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>
                      {rec.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {frequencyLabel[rec.frequency]} · Next: {rec.nextRunDate ? new Date(rec.nextRunDate).toLocaleDateString('en-NG') : '—'} · {rec.invoicesGenerated} generated
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleStatus(rec)} style={{
                    padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent', cursor: 'pointer', fontSize: 12,
                    color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {rec.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                  </button>
                  <button onClick={() => handleDelete(rec._id)} style={{
                    padding: '7px', borderRadius: 8, border: 'none',
                    backgroundColor: 'var(--color-danger-bg)', cursor: 'pointer',
                    color: 'var(--color-danger)', display: 'flex', alignItems: 'center',
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>New recurring invoice</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={18} /></button>
            </div>

            <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
              {error && (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Client</label>
                  <select onChange={handleCustomerSelect} style={inputStyle} defaultValue="">
                    <option value="">— Select client —</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {!form.customerId && (
                    <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                      placeholder="Or type name manually" style={{ ...inputStyle, marginTop: 6 }} />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Frequency</label>
                    <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} style={inputStyle}>
                      {Object.entries(frequencyLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Currency</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={inputStyle}>
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="CNY">CNY</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Start date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>End date (optional)</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <label style={labelStyle}>Line items</label>
                  {form.lineItems.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px', gap: 8, marginBottom: 8 }}>
                      <input value={item.description} onChange={e => handleLineItem(i, 'description', e.target.value)} placeholder="Description" style={inputStyle} />
                      <input type="number" value={item.quantity} onChange={e => handleLineItem(i, 'quantity', e.target.value)} min="1" style={inputStyle} />
                      <input type="number" value={item.unitPrice} onChange={e => handleLineItem(i, 'unitPrice', e.target.value)} placeholder="Price" style={inputStyle} />
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: '', quantity: 1, unitPrice: '' }] }))}
                    style={{ fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    + Add line item
                  </button>
                </div>

                <div>
                  <label style={labelStyle}>Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, notes..." style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 9, borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: 9, borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {submitting ? 'Creating...' : 'Create schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default RecurringInvoices