import { useState, useEffect } from 'react'
import { MessageSquare, Clock, CheckCircle, ExternalLink, History, X } from 'lucide-react'
import api from '../api/axios'

const TONES = [
  {
    key: 'polite',
    label: 'Polite',
    description: 'First reminder — friendly tone',
    color: 'var(--color-success)',
    bg: 'var(--color-success-bg)',
  },
  {
    key: 'firm',
    label: 'Firm',
    description: 'Second reminder — direct tone',
    color: 'var(--color-warning)',
    bg: 'var(--color-warning-bg)',
  },
  {
    key: 'final',
    label: 'Final Notice',
    description: 'Last resort — serious tone',
    color: 'var(--color-danger)',
    bg: 'var(--color-danger-bg)',
  },
]

const formatCurrency = (amount, currency = 'NGN') => {
  const symbols = { NGN: '₦', USD: '$', GBP: '£', CNY: '¥' }
  const sym = symbols[currency] || currency
  return `${sym}${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

const Reminders = () => {
  const [overdueInvoices, setOverdueInvoices] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overdue') // 'overdue' | 'history'
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedTone, setSelectedTone] = useState('polite')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null) // { message, waLink }
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [overdueRes, historyRes] = await Promise.all([
        api.get('/reminders/overdue'),
        api.get('/reminders/history'),
      ])
      setOverdueInvoices(overdueRes.data)
      setHistory(historyRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedInvoice) return setError('Select an invoice first')
    setGenerating(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.post('/reminders/generate', {
        invoiceId: selectedInvoice._id,
        tone: selectedTone,
        phoneNumber,
      })
      setResult(data)
      // Refresh history
      const { data: hist } = await api.get('/reminders/history')
      setHistory(hist)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate reminder')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (result?.message) {
      navigator.clipboard.writeText(result.message)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          Payment Reminders
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
          {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {[
          { key: 'overdue', label: 'Overdue invoices', icon: Clock },
          { key: 'history', label: 'Reminder history', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              borderBottom: `2px solid ${activeTab === key ? 'var(--color-primary)' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            <Icon size={14} />
            {label}
            {key === 'overdue' && overdueInvoices.length > 0 && (
              <span style={{ padding: '1px 7px', borderRadius: 10, backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 11, fontWeight: 700 }}>
                {overdueInvoices.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ── Overdue tab ── */}
      {activeTab === 'overdue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          {/* Invoice list */}
          <div>
            {overdueInvoices.length === 0 ? (
              <div style={{ borderRadius: 12, padding: '60px 20px', textAlign: 'center', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
                <CheckCircle size={32} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No overdue invoices. You're all caught up!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overdueInvoices.map(inv => (
                  <div
                    key={inv._id}
                    onClick={() => {
                      setSelectedInvoice(inv)
                      setPhoneNumber(inv.customerPhone || '')
                      setResult(null)
                    }}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      border: `1.5px solid ${selectedInvoice?._id === inv._id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: selectedInvoice?._id === inv._id ? 'rgba(37,99,235,0.04)' : 'var(--color-bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {inv.customerName}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {inv.invoiceNumber ? `#${inv.invoiceNumber}` : 'No invoice number'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {formatCurrency(inv.remainingBalance || inv.amount, inv.currency)}
                        </p>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                          backgroundColor: inv.daysOverdue > 30 ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                          color: inv.daysOverdue > 30 ? 'var(--color-danger)' : 'var(--color-warning)',
                        }}>
                          {inv.daysOverdue}d overdue
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reminder generator panel */}
          <div style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
            <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedInvoice ? `Remind — ${selectedInvoice.customerName}` : 'Select an invoice'}
                </p>
              </div>

              <div style={{ padding: 16 }}>
                {/* Tone selector */}
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tone</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {TONES.map(tone => (
                    <button
                      key={tone.key}
                      onClick={() => setSelectedTone(tone.key)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        border: `1.5px solid ${selectedTone === tone.key ? tone.color : 'var(--color-border)'}`,
                        backgroundColor: selectedTone === tone.key ? tone.bg : 'transparent',
                        textAlign: 'left',
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: tone.color }}>{tone.label}</p>
                        <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{tone.description}</p>
                      </div>
                      {selectedTone === tone.key && (
                        <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: tone.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle size={10} color="white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Phone number */}
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WhatsApp number</p>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+2348012345678"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
                />

                <button
                  onClick={handleGenerate}
                  disabled={generating || !selectedInvoice}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: generating || !selectedInvoice ? 'not-allowed' : 'pointer', opacity: !selectedInvoice ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <MessageSquare size={14} />
                  {generating ? 'Generating...' : 'Generate message'}
                </button>

                {/* Generated result */}
                {result && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', marginBottom: 10 }}>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                        {result.message}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handleCopy}
                        style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                      >
                        Copy message
                      </button>
                      {result.waLink && (<a
                        
                          href={result.waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', backgroundColor: '#25D366', fontSize: 12, color: 'white', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: 600 }}
                        >
                          <ExternalLink size={12} /> Open WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── History tab ── */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ borderRadius: 12, padding: '60px 20px', textAlign: 'center', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No reminders sent yet.</p>
            </div>
          ) : (
            <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Date', 'Customer', 'Invoice', 'Amount', 'Tone'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((log, i) => {
                    const tone = TONES.find(t => t.key === log.tone)
                    return (
                      <tr key={log._id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                          {new Date(log.sentAt).toLocaleDateString('en-NG')}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{log.customerName}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{log.invoiceNumber ? `#${log.invoiceNumber}` : '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--color-text-primary)' }}>
                          {formatCurrency(log.amount)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: tone?.bg, color: tone?.color }}>
                            {tone?.label || log.tone}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default Reminders