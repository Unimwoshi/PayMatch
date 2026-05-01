import { useState } from 'react'
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '13px',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  marginBottom: '6px',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const sectionStyle = {
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
  marginBottom: '12px',
}

const sectionHeaderStyle = {
  padding: '10px 14px',
  backgroundColor: 'var(--color-bg)',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  userSelect: 'none',
}

const Toggle = ({ enabled, onToggle, label, sublabel }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderBottom: '1px solid var(--color-border)',
    }}
  >
    <div>
      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>{label}</p>
      {sublabel && <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{sublabel}</p>}
    </div>
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: enabled ? 'var(--color-primary)' : 'var(--color-border)',
        position: 'relative',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        left: enabled ? '18px' : '2px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: 'white',
        transition: 'left 0.2s',
      }} />
    </button>
  </div>
)

const emptyLineItem = () => ({ description: '', quantity: 1, unitPrice: '' })

const formatCurrency = (amount, currency = 'NGN') => {
  const symbols = { NGN: '₦', USD: '$', GBP: '£', CNY: '¥' }
  const sym = symbols[currency] || currency
  if (!amount || isNaN(amount)) return `${sym}0.00`
  return `${sym}${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const CreateInvoiceModal = ({ onClose, onCreated, api }) => {
  const [step, setStep] = useState(1) // 1 = details, 2 = items & taxes
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showOptional, setShowOptional] = useState(false)

  const [form, setForm] = useState({
    invoiceNumber: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    customerPhone: '',
    currency: 'NGN',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  })

  const [lineItems, setLineItems] = useState([emptyLineItem()])
  const [vatEnabled, setVatEnabled] = useState(false)
  const [vatRate, setVatRate] = useState(7.5)
  const [whtEnabled, setWhtEnabled] = useState(false)
  const [whtRate, setWhtRate] = useState(5)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState('fixed')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const addLineItem = () => setLineItems([...lineItems, emptyLineItem()])

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
  }, 0)

  const discountAmount = discountType === 'percentage'
    ? subtotal * (Number(discount) / 100)
    : Number(discount)

  const discountedTotal = subtotal - discountAmount
  const vatAmount = vatEnabled ? discountedTotal * (vatRate / 100) : 0
  const whtAmount = whtEnabled ? discountedTotal * (whtRate / 100) : 0
  const grandTotal = discountedTotal + vatAmount - whtAmount

  const handleNext = () => {
    if (!form.customerName) return setError('Customer name is required')
    if (!form.issueDate) return setError('Issue date is required')
    setError('')
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!lineItems.some(i => i.description && i.unitPrice)) {
      return setError('Add at least one complete line item')
    }

    setSubmitting(true)
    setError('')
    try {
      const payload = {
        ...form,
        lineItems: lineItems.filter(i => i.description && i.unitPrice).map(i => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice),
        })),
        vatEnabled,
        vatRate: Number(vatRate),
        whtEnabled,
        whtRate: Number(whtRate),
        discount: Number(discount),
        discountType,
      }

      const { data } = await api.post('/invoices', payload)
      onCreated(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const sym = { NGN: '₦', USD: '$', GBP: '£', CNY: '¥' }[form.currency] || '₦'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              New invoice
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {step === 1 ? 'Customer details' : 'Line items & totals'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  width: s === step ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: s === step ? 'var(--color-primary)' : 'var(--color-border)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            margin: '12px 20px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            flexShrink: 0,
          }}>
            {error}
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>

          {/* ── STEP 1: Customer details ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Customer name *</label>
                  <input name="customerName" value={form.customerName} onChange={handleChange}
                    placeholder="Dangote Cement" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select name="currency" value={form.currency} onChange={handleChange} style={inputStyle}>
                    <option value="NGN">NGN — Naira (₦)</option>
                    <option value="USD">USD — Dollar ($)</option>
                    <option value="GBP">GBP — Pound (£)</option>
                    <option value="CNY">CNY — Yuan (¥)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Issue date *</label>
                  <input name="issueDate" type="date" value={form.issueDate} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Due date</label>
                  <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Invoice number</label>
                <input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange}
                  placeholder="INV-001 (auto if blank)" style={inputStyle} />
              </div>

              {/* Optional fields toggle */}
              <button
                type="button"
                onClick={() => setShowOptional(!showOptional)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: '12px', color: 'var(--color-text-muted)',
                }}
              >
                {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showOptional ? 'Hide' : 'Add'} customer contact details
              </button>

              {showOptional && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input name="customerEmail" value={form.customerEmail} onChange={handleChange}
                        placeholder="client@company.com" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input name="customerPhone" value={form.customerPhone} onChange={handleChange}
                        placeholder="+234 801 234 5678" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Address</label>
                    <input name="customerAddress" value={form.customerAddress} onChange={handleChange}
                      placeholder="12 Broad Street, Lagos Island" style={inputStyle} />
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>Notes / payment terms</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Payment due within 30 days. Bank transfer only."
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Line items & totals ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Line items */}
              <div style={sectionStyle}>
                <div style={{ ...sectionHeaderStyle, cursor: 'default' }}>
                  Line items
                </div>

                {/* Column headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 64px 100px 32px',
                  gap: '8px',
                  padding: '8px 14px 4px',
                  backgroundColor: 'var(--color-bg)',
                }}>
                  {['Description', 'Qty', `Price (${sym})`, ''].map(h => (
                    <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </span>
                  ))}
                </div>

                <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lineItems.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 100px 32px', gap: '8px', alignItems: 'center' }}>
                      <input
                        value={item.description}
                        onChange={e => handleLineItemChange(i, 'description', e.target.value)}
                        placeholder="Description"
                        style={inputStyle}
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleLineItemChange(i, 'quantity', e.target.value)}
                        min="1"
                        style={inputStyle}
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={e => handleLineItemChange(i, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => removeLineItem(i)}
                        disabled={lineItems.length === 1}
                        style={{
                          background: 'none', border: 'none', cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer',
                          color: lineItems.length === 1 ? 'var(--color-border)' : 'var(--color-danger)',
                          padding: '4px', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Row subtotal */}
                      {item.description && item.unitPrice && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '-4px' }}>
                          Subtotal: {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), form.currency)}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addLineItem}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 12px', borderRadius: '8px', border: '1px dashed var(--color-border)',
                      backgroundColor: 'transparent', cursor: 'pointer',
                      fontSize: '12px', color: 'var(--color-text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    <Plus size={13} /> Add line item
                  </button>
                </div>
              </div>

              {/* Discount */}
              <div style={sectionStyle}>
                <div style={sectionHeaderStyle}>Discount</div>
                <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px' }}>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="0"
                    min="0"
                    style={inputStyle}
                  />
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={inputStyle}>
                    <option value="fixed">Fixed ({sym})</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>

              {/* VAT & WHT */}
              <div style={sectionStyle}>
                <div style={{ ...sectionHeaderStyle, cursor: 'default' }}>Tax</div>
                <Toggle
                  enabled={vatEnabled}
                  onToggle={() => setVatEnabled(!vatEnabled)}
                  label="VAT"
                  sublabel={`${vatRate}% on subtotal after discount`}
                />
                {vatEnabled && (
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <label style={labelStyle}>VAT rate (%)</label>
                    <input type="number" value={vatRate} onChange={e => setVatRate(e.target.value)}
                      min="0" max="100" style={{ ...inputStyle, width: '100px' }} />
                  </div>
                )}
                <Toggle
                  enabled={whtEnabled}
                  onToggle={() => setWhtEnabled(!whtEnabled)}
                  label="Withholding Tax (WHT)"
                  sublabel={`${whtRate}% deducted from subtotal`}
                />
                {whtEnabled && (
                  <div style={{ padding: '8px 14px' }}>
                    <label style={labelStyle}>WHT rate (%)</label>
                    <input type="number" value={whtRate} onChange={e => setWhtRate(e.target.value)}
                      min="0" max="100" style={{ ...inputStyle, width: '100px' }} />
                  </div>
                )}
              </div>

              {/* Totals summary */}
              <div style={{
                ...sectionStyle,
                backgroundColor: 'var(--color-bg)',
                marginBottom: 0,
              }}>
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Subtotal', value: formatCurrency(subtotal, form.currency) },
                    ...(discountAmount > 0 ? [{ label: `Discount (${discountType === 'percentage' ? discount + '%' : sym + discount})`, value: `− ${formatCurrency(discountAmount, form.currency)}` }] : []),
                    ...(vatEnabled ? [{ label: `VAT (${vatRate}%)`, value: formatCurrency(vatAmount, form.currency) }] : []),
                    ...(whtEnabled ? [{ label: `WHT (${whtRate}%)`, value: `− ${formatCurrency(whtAmount, form.currency)}` }] : []),
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    paddingTop: '8px', marginTop: '4px',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '15px', fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(grandTotal, form.currency)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: '10px', padding: '14px 20px',
          borderTop: '1px solid var(--color-border)',
          flexShrink: 0,
          backgroundColor: 'var(--color-bg-card)',
        }}>
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(1)}
            style={{
              flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
              border: '1px solid var(--color-border)', backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button
            type="button"
            onClick={step === 1 ? handleNext : handleSubmit}
            disabled={submitting}
            style={{
              flex: 2, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              border: 'none', backgroundColor: 'var(--color-primary)',
              color: 'white', cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {step === 1 ? 'Next — Add line items →' : (submitting ? 'Creating...' : 'Create invoice')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateInvoiceModal