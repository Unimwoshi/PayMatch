import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import {
  ArrowLeft, Download, Layout, Upload,
  Check, Move, RotateCcw, Save
} from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────
const A4_WIDTH_PX = 595
const A4_HEIGHT_PX = 842

const FIELD_KEYS = [
  { key: 'businessName',    label: 'Business Name',    default: { x: 48,  y: 36,  width: 280, fontSize: 14, fontWeight: 'bold',   align: 'left'  } },
  { key: 'businessAddress', label: 'Business Address', default: { x: 48,  y: 56,  width: 280, fontSize: 8,  fontWeight: 'normal', align: 'left'  } },
  { key: 'businessPhone',   label: 'Business Phone',   default: { x: 48,  y: 68,  width: 280, fontSize: 8,  fontWeight: 'normal', align: 'left'  } },
  { key: 'businessEmail',   label: 'Business Email',   default: { x: 48,  y: 80,  width: 280, fontSize: 8,  fontWeight: 'normal', align: 'left'  } },
  { key: 'invoiceNumber',   label: 'Invoice Number',   default: { x: 48,  y: 140, width: 200, fontSize: 20, fontWeight: 'bold',   align: 'left'  } },
  { key: 'issueDate',       label: 'Issue Date',       default: { x: 367, y: 140, width: 180, fontSize: 9,  fontWeight: 'normal', align: 'right' } },
  { key: 'dueDate',         label: 'Due Date',         default: { x: 367, y: 158, width: 180, fontSize: 9,  fontWeight: 'normal', align: 'right' } },
  { key: 'customerName',    label: 'Customer Name',    default: { x: 48,  y: 230, width: 250, fontSize: 12, fontWeight: 'bold',   align: 'left'  } },
  { key: 'customerAddress', label: 'Customer Address', default: { x: 48,  y: 246, width: 250, fontSize: 8,  fontWeight: 'normal', align: 'left'  } },
  { key: 'customerEmail',   label: 'Customer Email',   default: { x: 48,  y: 258, width: 250, fontSize: 8,  fontWeight: 'normal', align: 'left'  } },
  { key: 'subtotal',        label: 'Subtotal',         default: { x: 367, y: 620, width: 180, fontSize: 9,  fontWeight: 'normal', align: 'right' } },
  { key: 'vatAmount',       label: 'VAT Amount',       default: { x: 367, y: 638, width: 180, fontSize: 9,  fontWeight: 'normal', align: 'right' } },
  { key: 'whtAmount',       label: 'WHT Amount',       default: { x: 367, y: 656, width: 180, fontSize: 9,  fontWeight: 'normal', align: 'right' } },
  { key: 'total',           label: 'Total',            default: { x: 367, y: 678, width: 180, fontSize: 12, fontWeight: 'bold',   align: 'right' } },
  { key: 'bankName',        label: 'Bank Name',        default: { x: 48,  y: 720, width: 250, fontSize: 9,  fontWeight: 'normal', align: 'left'  } },
  { key: 'accountNumber',   label: 'Account Number',   default: { x: 48,  y: 734, width: 250, fontSize: 9,  fontWeight: 'normal', align: 'left'  } },
  { key: 'accountName',     label: 'Account Name',     default: { x: 48,  y: 748, width: 250, fontSize: 9,  fontWeight: 'normal', align: 'left'  } },
  { key: 'notes',           label: 'Notes',            default: { x: 48,  y: 780, width: 500, fontSize: 8,  fontWeight: 'normal', align: 'left'  } },
  { key: 'lineItemsTable',  label: 'Line Items Table', default: { x: 48,  y: 290, width: 500, fontSize: 9,  fontWeight: 'normal', align: 'left'  } },
]

const MINIMAL_FIELD_DEFAULTS = [
  { key: 'businessName',    x: 48,  y: 32,  width: 200, fontSize: 11, fontWeight: 'bold',   align: 'left'  },
  { key: 'businessAddress', x: 48,  y: 48,  width: 200, fontSize: 8,  fontWeight: 'normal', align: 'left'  },
  { key: 'businessPhone',   x: 48,  y: 58,  width: 200, fontSize: 8,  fontWeight: 'normal', align: 'left'  },
  { key: 'businessEmail',   x: 48,  y: 68,  width: 200, fontSize: 8,  fontWeight: 'normal', align: 'left'  },
  { key: 'invoiceNumber',   x: 300, y: 32,  width: 200, fontSize: 10, fontWeight: 'bold',   align: 'right' },
  { key: 'issueDate',       x: 300, y: 48,  width: 200, fontSize: 8,  fontWeight: 'normal', align: 'right' },
  { key: 'dueDate',         x: 300, y: 58,  width: 200, fontSize: 8,  fontWeight: 'normal', align: 'right' },
  { key: 'customerName',    x: 48,  y: 190, width: 250, fontSize: 11, fontWeight: 'bold',   align: 'left'  },
  { key: 'customerAddress', x: 48,  y: 206, width: 250, fontSize: 8,  fontWeight: 'normal', align: 'left'  },
  { key: 'customerEmail',   x: 48,  y: 216, width: 250, fontSize: 8,  fontWeight: 'normal', align: 'left'  },
  { key: 'lineItemsTable',  x: 48,  y: 280, width: 500, fontSize: 9,  fontWeight: 'normal', align: 'left'  },
  { key: 'subtotal',        x: 367, y: 520, width: 180, fontSize: 9,  fontWeight: 'normal', align: 'right' },
  { key: 'vatAmount',       x: 367, y: 538, width: 180, fontSize: 9,  fontWeight: 'normal', align: 'right' },
  { key: 'whtAmount',       x: 367, y: 556, width: 180, fontSize: 9,  fontWeight: 'normal', align: 'right' },
  { key: 'total',           x: 367, y: 576, width: 180, fontSize: 13, fontWeight: 'bold',   align: 'right' },
  { key: 'bankName',        x: 48,  y: 640, width: 250, fontSize: 9,  fontWeight: 'normal', align: 'left'  },
  { key: 'accountNumber',   x: 48,  y: 654, width: 250, fontSize: 9,  fontWeight: 'normal', align: 'left'  },
  { key: 'accountName',     x: 48,  y: 668, width: 250, fontSize: 9,  fontWeight: 'normal', align: 'left'  },
  { key: 'notes',           x: 48,  y: 720, width: 500, fontSize: 8,  fontWeight: 'normal', align: 'left'  },
]

// ── Helpers ────────────────────────────────────────────────────────────────
const SYM = { NGN: '₦', USD: '$', GBP: '£', CNY: '¥' }
const currencySymbol = (c) => SYM[c] || c
const formatAmt = (amt, cur) =>
  `${currencySymbol(cur)}${Number(amt || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// Derive the background templateId from a template object (works for user copies too)
const getTemplateId = (tpl) => {
  if (!tpl) return 'classic'
  if (tpl.templateId) return tpl.templateId
  // User copies of classic/minimal have the word in their name
  if (tpl.name?.toLowerCase().includes('minimal')) return 'minimal'
  return 'classic'
}

// ── Field value resolver ───────────────────────────────────────────────────
const resolveFieldValues = (invoice, user) => ({
  businessName:    user?.businessName || 'Your Business',
  businessAddress: user?.businessDetails?.address || '',
  businessPhone:   user?.businessDetails?.phone || '',
  businessEmail:   user?.email || '',
  invoiceNumber:   `#${invoice?.invoiceNumber || 'N/A'}`,
  issueDate:       `Issue Date: ${formatDate(invoice?.issueDate)}`,
  dueDate:         `Due Date: ${formatDate(invoice?.dueDate)}`,
  customerName:    invoice?.customerName || '',
  customerAddress: invoice?.customerAddress || '',
  customerEmail:   invoice?.customerEmail || '',
  subtotal:        `Subtotal: ${formatAmt(invoice?.subtotal, invoice?.currency)}`,
  vatAmount:       invoice?.vatEnabled
    ? `VAT (${invoice?.vatRate}%): ${formatAmt(invoice?.vatAmount, invoice?.currency)}` : '',
  whtAmount:       invoice?.whtEnabled
    ? `WHT (${invoice?.whtRate}%): −${formatAmt(invoice?.whtAmount, invoice?.currency)}` : '',
  total:           `TOTAL: ${formatAmt(invoice?.amount, invoice?.currency)}`,
  bankName:        invoice?.bankName    ? `Bank: ${invoice.bankName}`          : '',
  accountNumber:   invoice?.accountNumber ? `Acct No: ${invoice.accountNumber}` : '',
  accountName:     invoice?.accountName   ? `Acct Name: ${invoice.accountName}` : '',
  notes:           invoice?.notes || '',
  lineItemsTable:  '[Line Items Table]',
})

// ── Sub-components ─────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-bg)' }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
  </div>
)

const TemplateCard = ({ template, selected, onSelect }) => (
  <div
    onClick={() => onSelect(template)}
    style={{
      border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
      borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
      transition: 'all 0.15s', position: 'relative',
      backgroundColor: 'var(--color-bg-card)',
    }}
  >
    <div style={{ height: 160, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {template.previewUrl
        ? <img src={template.previewUrl} alt={template.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <TemplateThumbnail type={getTemplateId(template)} />
      }
      {selected && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={13} color="white" />
        </div>
      )}
    </div>
    <div style={{ padding: '10px 12px' }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{template.name}</p>
      <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{template.description || 'Free template'}</p>
    </div>
  </div>
)

const TemplateThumbnail = ({ type }) => {
  if (type === 'classic') return (
    <svg width="80" height="113" viewBox="0 0 80 113" fill="none">
      <rect width="80" height="113" fill="white" />
      <rect width="80" height="18" fill="#2563EB" />
      <rect x="6" y="4" width="35" height="4" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="6" y="10" width="20" height="2" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="6" y="22" width="28" height="5" rx="1" fill="#111827" />
      <rect x="6" y="30" width="15" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="6" y="38" width="12" height="2" rx="0.5" fill="#6B7280" />
      <rect x="6" y="42" width="18" height="2" rx="0.5" fill="#6B7280" />
      <rect x="6" y="50" width="74" height="8" rx="1" fill="#F3F4F6" />
      <rect x="8" y="53" width="20" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="38" y="53" width="10" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="54" y="53" width="12" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="6" y="60" width="74" height="6" rx="0.5" fill="white" />
      <rect x="8" y="62" width="22" height="2" rx="0.5" fill="#D1D5DB" />
      <rect x="6" y="68" width="74" height="6" rx="0.5" fill="#F9FAFB" />
      <rect x="8" y="70" width="18" height="2" rx="0.5" fill="#D1D5DB" />
      <rect x="44" y="82" width="30" height="3" rx="0.5" fill="#E5E7EB" />
      <rect x="44" y="87" width="30" height="3" rx="0.5" fill="#E5E7EB" />
      <rect x="44" y="94" width="30" height="8" rx="1" fill="#2563EB" />
      <rect x="6" y="104" width="68" height="7" rx="1" fill="#F3F4F6" />
    </svg>
  )
  if (type === 'minimal') return (
    <svg width="80" height="113" viewBox="0 0 80 113" fill="none">
      <rect width="80" height="113" fill="white" />
      <rect x="6" y="8" width="30" height="4" rx="1" fill="#111827" />
      <rect x="6" y="14" width="18" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="50" y="8" width="24" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="50" y="12" width="20" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="6" y="24" width="74" height="0.5" fill="#E5E7EB" />
      <rect x="6" y="30" width="20" height="4" rx="1" fill="#111827" />
      <rect x="6" y="38" width="12" height="2" rx="0.5" fill="#6B7280" />
      <rect x="6" y="42" width="18" height="2" rx="0.5" fill="#6B7280" />
      <rect x="6" y="52" width="74" height="0.5" fill="#E5E7EB" />
      <rect x="6" y="56" width="20" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="40" y="56" width="10" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="56" y="56" width="18" height="2" rx="0.5" fill="#9CA3AF" />
      <rect x="6" y="62" width="74" height="5" rx="0.5" fill="white" />
      <rect x="8" y="64" width="22" height="1.5" rx="0.5" fill="#D1D5DB" />
      <rect x="6" y="69" width="74" height="5" rx="0.5" fill="white" />
      <rect x="8" y="71" width="18" height="1.5" rx="0.5" fill="#D1D5DB" />
      <rect x="6" y="80" width="74" height="0.5" fill="#E5E7EB" />
      <rect x="50" y="84" width="24" height="3" rx="0.5" fill="#D1D5DB" />
      <rect x="50" y="89" width="24" height="4" rx="1" fill="#111827" />
      <rect x="6" y="100" width="40" height="5" rx="1" fill="#F3F4F6" />
    </svg>
  )
  return (
    <div style={{ width: 80, height: 113, backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Layout size={24} color="#9CA3AF" />
    </div>
  )
}

const DraggableField = ({ field, value, scale, isSelected, onSelect, onDragEnd }) => {
  const dragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0, fieldX: 0, fieldY: 0 })

  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect(field.key)
    dragging.current = true
    startPos.current = { x: e.clientX, y: e.clientY, fieldX: field.x, fieldY: field.y }

    const handleMouseMove = (e) => {
      if (!dragging.current) return
      const dx = (e.clientX - startPos.current.x) / scale
      const dy = (e.clientY - startPos.current.y) / scale
      onDragEnd(field.key, {
        x: Math.max(0, Math.min(A4_WIDTH_PX - field.width, startPos.current.fieldX + dx)),
        y: Math.max(0, Math.min(A4_HEIGHT_PX - 20, startPos.current.fieldY + dy)),
      })
    }
    const handleMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  if (!value) return null
  const isTable = field.key === 'lineItemsTable'

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        cursor: 'move',
        userSelect: 'none',
        border: `1.5px ${isSelected ? 'solid' : 'dashed'} ${isSelected ? 'var(--color-primary)' : 'rgba(37,99,235,0.35)'}`,
        borderRadius: 3,
        backgroundColor: isSelected ? 'rgba(37,99,235,0.07)' : 'rgba(255,255,255,0.5)',
        padding: '2px 4px',
        zIndex: isSelected ? 10 : 5,
      }}
    >
      {isTable ? (
        <div style={{ fontSize: 7 * scale, color: '#6B7280', fontStyle: 'italic' }}>
          [Line Items Table — positioned here]
        </div>
      ) : (
        <div style={{
          fontSize: Math.max(6, field.fontSize * scale * 0.9),
          fontWeight: field.fontWeight === 'bold' ? 700 : 400,
          color: '#111827',
          textAlign: field.align,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {value}
        </div>
      )}
      {isSelected && (
        <div style={{
          position: 'absolute', top: -14, left: 0,
          fontSize: 9, backgroundColor: 'var(--color-primary)',
          color: 'white', padding: '1px 5px', borderRadius: 3,
          whiteSpace: 'nowrap',
        }}>
          <Move size={8} style={{ display: 'inline', marginRight: 3 }} />
          {field.label}
        </div>
      )}
    </div>
  )
}

// ── Invoice View — clean rendered preview ──────────────────────────────────
const InvoiceView = ({ invoice, user, selectedTemplate, scale, onEditLayout }) => {
  const sym = SYM[invoice?.currency] || '₦'
  const templateId = getTemplateId(selectedTemplate)
  const isClassic = templateId === 'classic' || !selectedTemplate?.backgroundUrl

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', justifyContent: 'center', backgroundColor: '#E5E7EB' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: A4_WIDTH_PX + 64 }}>

        <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
          <button
            onClick={onEditLayout}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: 'white', fontSize: 12, color: '#374151', cursor: 'pointer' }}
          >
            Edit layout
          </button>
        </div>

        {/* A4 page */}
        <div style={{
          width: A4_WIDTH_PX * scale,
          backgroundColor: 'white',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        }}>

          {/* Background layer */}
          {selectedTemplate?.backgroundUrl
            ? <img src={selectedTemplate.backgroundUrl} alt="Template"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0.15 }} />
            : templateId === 'minimal'
              ? <MinimalBackground scale={scale} />
              : <ClassicBackground scale={scale} />
          }

          {/* ── Classic layout ── */}
          {isClassic && (
            <div style={{ position: 'relative' }}>
              {/* Header business info — sits on blue band */}
              <div style={{ padding: `${28 * scale}px ${48 * scale}px`, minHeight: 120 * scale }}>
                <p style={{ margin: 0, fontSize: 18 * scale, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                  {user?.businessName || 'Your Business'}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 8 * scale, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                  {[user?.businessDetails?.address, user?.businessDetails?.phone, user?.email].filter(Boolean).join('  ·  ')}
                </p>
              </div>

              <div style={{ padding: `${16 * scale}px ${48 * scale}px ${48 * scale}px` }}>
                {/* Invoice heading row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 * scale }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 26 * scale, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>INVOICE</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11 * scale, color: '#6B7280' }}>
                      #{invoice?.invoiceNumber || ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 10 * scale, color: '#6B7280' }}>
                      Issue date: {invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-NG') : '—'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 10 * scale, color: '#6B7280' }}>
                      Due date: {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-NG') : '—'}
                    </p>
                    <span style={{
                      display: 'inline-block', marginTop: 6,
                      padding: '3px 10px', borderRadius: 10, fontSize: 10 * scale, fontWeight: 600,
                      backgroundColor: invoice?.status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                      color: invoice?.status === 'paid' ? '#065F46' : '#92400E',
                    }}>
                      {(invoice?.status || 'pending').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 * scale }} />

                {/* Bill to */}
                <div style={{ marginBottom: 24 * scale }}>
                  <p style={{ margin: '0 0 6px', fontSize: 8 * scale, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>BILL TO</p>
                  <p style={{ margin: 0, fontSize: 13 * scale, fontWeight: 700, color: '#111827' }}>{invoice?.customerName}</p>
                  {invoice?.customerAddress && <p style={{ margin: '2px 0 0', fontSize: 9 * scale, color: '#6B7280' }}>{invoice.customerAddress}</p>}
                  {invoice?.customerEmail  && <p style={{ margin: '2px 0 0', fontSize: 9 * scale, color: '#6B7280' }}>{invoice.customerEmail}</p>}
                  {invoice?.customerPhone  && <p style={{ margin: '2px 0 0', fontSize: 9 * scale, color: '#6B7280' }}>{invoice.customerPhone}</p>}
                </div>

                {/* Line items */}
                <LineItemsTable invoice={invoice} scale={scale} sym={sym} />

                {/* Totals */}
                <TotalsBlock invoice={invoice} scale={scale} sym={sym} />

                {/* Bank details */}
                {(invoice?.bankName || invoice?.accountNumber) && (
                  <div style={{ padding: `${12 * scale}px ${14 * scale}px`, backgroundColor: '#F9FAFB', borderRadius: 8, marginBottom: 16 * scale }}>
                    <p style={{ margin: '0 0 6px', fontSize: 8 * scale, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>PAYMENT DETAILS</p>
                    {invoice.bankName      && <p style={{ margin: '2px 0', fontSize: 9 * scale, color: '#374151' }}>Bank: {invoice.bankName}</p>}
                    {invoice.accountNumber && <p style={{ margin: '2px 0', fontSize: 9 * scale, color: '#374151' }}>Account No: {invoice.accountNumber}</p>}
                    {invoice.accountName   && <p style={{ margin: '2px 0', fontSize: 9 * scale, color: '#374151' }}>Account Name: {invoice.accountName}</p>}
                  </div>
                )}

                {/* Notes */}
                {invoice?.notes && (
                  <div style={{ marginBottom: 16 * scale }}>
                    <p style={{ margin: '0 0 4px', fontSize: 8 * scale, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>NOTES</p>
                    <p style={{ margin: 0, fontSize: 9 * scale, color: '#6B7280' }}>{invoice.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: 24 * scale, paddingTop: 12 * scale, borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 7 * scale, color: '#D1D5DB' }}>Powered by Aethr</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Minimal layout ── */}
          {!isClassic && templateId === 'minimal' && (
            <div style={{ position: 'relative', padding: `${24 * scale}px ${48 * scale}px ${48 * scale}px` }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 * scale, marginTop: 8 * scale }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13 * scale, fontWeight: 700, color: '#111827' }}>{user?.businessName || 'Your Business'}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 8 * scale, color: '#6B7280', lineHeight: 1.6 }}>
                    {[user?.businessDetails?.address, user?.businessDetails?.phone, user?.email].filter(Boolean).join('\n')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 10 * scale, fontWeight: 700, color: '#111827' }}>#{invoice?.invoiceNumber || ''}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 9 * scale, color: '#6B7280' }}>
                    {invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-NG') : '—'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 9 * scale, color: '#6B7280' }}>
                    Due: {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-NG') : '—'}
                  </p>
                </div>
              </div>

              <div style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 * scale }} />

              {/* Bill to */}
              <div style={{ marginBottom: 24 * scale }}>
                <p style={{ margin: '0 0 6px', fontSize: 8 * scale, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>BILL TO</p>
                <p style={{ margin: 0, fontSize: 12 * scale, fontWeight: 700, color: '#111827' }}>{invoice?.customerName}</p>
                {invoice?.customerAddress && <p style={{ margin: '2px 0 0', fontSize: 9 * scale, color: '#6B7280' }}>{invoice.customerAddress}</p>}
                {invoice?.customerEmail   && <p style={{ margin: '2px 0 0', fontSize: 9 * scale, color: '#6B7280' }}>{invoice.customerEmail}</p>}
              </div>

              <LineItemsTable invoice={invoice} scale={scale} sym={sym} />
              <TotalsBlock invoice={invoice} scale={scale} sym={sym} />

              {(invoice?.bankName || invoice?.accountNumber) && (
                <div style={{ padding: `${10 * scale}px ${12 * scale}px`, backgroundColor: '#F9FAFB', borderRadius: 6, marginBottom: 14 * scale }}>
                  <p style={{ margin: '0 0 4px', fontSize: 8 * scale, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>PAYMENT DETAILS</p>
                  {invoice.bankName      && <p style={{ margin: '2px 0', fontSize: 9 * scale, color: '#374151' }}>Bank: {invoice.bankName}</p>}
                  {invoice.accountNumber && <p style={{ margin: '2px 0', fontSize: 9 * scale, color: '#374151' }}>Account No: {invoice.accountNumber}</p>}
                  {invoice.accountName   && <p style={{ margin: '2px 0', fontSize: 9 * scale, color: '#374151' }}>Account Name: {invoice.accountName}</p>}
                </div>
              )}

              {invoice?.notes && (
                <div style={{ marginBottom: 16 * scale }}>
                  <p style={{ margin: '0 0 4px', fontSize: 8 * scale, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>NOTES</p>
                  <p style={{ margin: 0, fontSize: 9 * scale, color: '#6B7280' }}>{invoice.notes}</p>
                </div>
              )}

              <div style={{ marginTop: 20 * scale, paddingTop: 10 * scale, borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 7 * scale, color: '#D1D5DB' }}>Powered by Aethr</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared table sub-components ────────────────────────────────────────────
const LineItemsTable = ({ invoice, scale, sym }) => (
  <div style={{ marginBottom: 20 * scale }}>
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 60px 100px 100px',
      gap: 8, padding: `${8 * scale}px ${10 * scale}px`,
      backgroundColor: '#F3F4F6', borderRadius: '4px 4px 0 0',
    }}>
      {['Description', 'Qty', 'Unit price', 'Subtotal'].map(h => (
        <p key={h} style={{ margin: 0, fontSize: 8 * scale, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</p>
      ))}
    </div>
    {invoice?.lineItems?.length > 0 ? invoice.lineItems.map((item, i) => {
      const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
      return (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr 60px 100px 100px',
          gap: 8, padding: `${8 * scale}px ${10 * scale}px`,
          backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA',
          borderBottom: '1px solid #F3F4F6',
        }}>
          <p style={{ margin: 0, fontSize: 10 * scale, color: '#111827' }}>{item.description}</p>
          <p style={{ margin: 0, fontSize: 10 * scale, color: '#374151', textAlign: 'center' }}>{item.quantity}</p>
          <p style={{ margin: 0, fontSize: 10 * scale, color: '#374151', textAlign: 'right' }}>{sym}{Number(item.unitPrice).toLocaleString('en-NG')}</p>
          <p style={{ margin: 0, fontSize: 10 * scale, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{sym}{subtotal.toLocaleString('en-NG')}</p>
        </div>
      )
    }) : (
      <div style={{ padding: `${12 * scale}px ${10 * scale}px`, fontSize: 10 * scale, color: '#9CA3AF', fontStyle: 'italic' }}>
        No line items recorded
      </div>
    )}
  </div>
)

const TotalsBlock = ({ invoice, scale, sym }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 * scale }}>
    <div style={{ width: 220 * scale }}>
      {[
        { label: 'Subtotal', value: invoice?.subtotal },
        ...(invoice?.discount > 0 ? [{ label: 'Discount', value: -(invoice.discountAmount || 0) }] : []),
        ...(invoice?.vatEnabled ? [{ label: `VAT (${invoice.vatRate}%)`, value: invoice.vatAmount }] : []),
        ...(invoice?.whtEnabled ? [{ label: `WHT (${invoice.whtRate}%)`, value: -(invoice.whtAmount || 0) }] : []),
      ].map(row => (
        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: `${4 * scale}px 0` }}>
          <span style={{ fontSize: 9 * scale, color: '#6B7280' }}>{row.label}</span>
          <span style={{ fontSize: 9 * scale, color: '#374151' }}>
            {row.value < 0
              ? `−${sym}${Math.abs(row.value).toLocaleString('en-NG')}`
              : `${sym}${Number(row.value || 0).toLocaleString('en-NG')}`}
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${8 * scale}px ${10 * scale}px`, backgroundColor: '#111827', borderRadius: 6, marginTop: 8 }}>
        <span style={{ fontSize: 11 * scale, fontWeight: 700, color: 'white' }}>TOTAL</span>
        <span style={{ fontSize: 11 * scale, fontWeight: 700, color: 'white' }}>
          {sym}{Number(invoice?.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  </div>
)

// ── Main Component ─────────────────────────────────────────────────────────
const InvoicePreview = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const mode = searchParams.get('mode') || 'view'

  const [invoice, setInvoice]               = useState(null)
  const [user, setUser]                     = useState(null)
  const [templates, setTemplates]           = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [view, setView]                     = useState(mode === 'edit' ? 'picker' : 'invoice-view')
  const [fields, setFields]                 = useState([])
  const [selectedField, setSelectedField]   = useState(null)
  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)
  const [downloading, setDownloading]       = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [scale, setScale]                   = useState(1)
  const [uploadingTemplate, setUploadingTemplate] = useState(false)

  // Scale canvas to fit viewport
  useEffect(() => {
    const update = () => {
      const availW = window.innerWidth - 320 - 48
      setScale(Math.min(1, availW / A4_WIDTH_PX))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Load invoice + user + templates
  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, meRes, tplRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get('/auth/me'),
          api.get('/templates'),
        ])
        setInvoice(invRes.data)
        setUser(meRes.data)

        const builtIn = [
          { _id: 'classic', name: 'Classic', description: 'Clean & professional', type: 'free', templateId: 'classic', fieldPositions: [] },
          { _id: 'minimal', name: 'Minimal', description: 'Simple, no-frills layout', type: 'free', templateId: 'minimal', fieldPositions: [] },
        ]
        const dbTemplates = tplRes.data || []
        setTemplates([...builtIn, ...dbTemplates])

        // Restore user's default template if exists
        const defaultTpl = dbTemplates.find(t => t.isDefault)
        if (defaultTpl) {
          setSelectedTemplate(defaultTpl)
          initFieldsForTemplate(defaultTpl)
          setView(mode === 'edit' ? 'editor' : 'invoice-view')
        } else {
          // Pre-select classic so the view always shows something
          setSelectedTemplate(builtIn[0])
          initFieldsForTemplate(builtIn[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Build fields array from a template — respects saved positions, then template defaults, then FIELD_KEYS defaults
  const initFieldsForTemplate = useCallback((tpl) => {
    const savedPositions = tpl?.fieldPositions || []
    const templateId = getTemplateId(tpl)
    const templateDefaults = templateId === 'minimal' ? MINIMAL_FIELD_DEFAULTS : []

    setFields(FIELD_KEYS.map(f => {
      const saved = savedPositions.find(p => p.key === f.key)
      if (saved) return { ...f, ...saved }
      const tplDefault = templateDefaults.find(p => p.key === f.key)
      if (tplDefault) return { ...f, ...tplDefault }
      return { ...f, ...f.default }
    }))
  }, [])

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl)
    initFieldsForTemplate(tpl)
    setView('editor')
  }

  const handleDragEnd = useCallback((key, pos) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, ...pos } : f))
  }, [])

  // Reset resets to the CURRENT template's defaults, not FIELD_KEYS defaults
  const handleReset = () => {
    if (selectedTemplate) initFieldsForTemplate({ ...selectedTemplate, fieldPositions: [] })
  }

  const handleSave = async () => {
    if (!selectedTemplate) return
    setSaving(true)
    try {
      const positions = fields.map(({ key, label, x, y, width, fontSize, fontWeight, align }) => ({
        key, label, x, y, width, fontSize, fontWeight, align,
      }))
      const { data } = await api.put(`/templates/${selectedTemplate._id}/positions`, { fieldPositions: positions })
      // Backend returns either updated template or a new user copy — update both
      setSelectedTemplate(data)
      // Update the templates list so the picker reflects this
      setTemplates(prev => {
        const exists = prev.find(t => t._id === data._id)
        return exists ? prev.map(t => t._id === data._id ? data : t) : [...prev, data]
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.invoiceNumber || id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  const handleCustomUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingTemplate(true)
    try {
      const formData = new FormData()
      formData.append('template', file)
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''))
      const { data } = await api.post('/templates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setTemplates(prev => [...prev, data])
      handleSelectTemplate(data)
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingTemplate(false)
    }
  }

  const fieldValues = resolveFieldValues(invoice, user)

  if (loading) return <Spinner />

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13 }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width: 1, height: 16, backgroundColor: 'var(--color-border)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Invoice {invoice?.invoiceNumber ? `#${invoice.invoiceNumber}` : ''}
          </span>
          {selectedTemplate && (
            <>
              <div style={{ width: 1, height: 16, backgroundColor: 'var(--color-border)' }} />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{selectedTemplate.name}</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {view === 'editor' && (
            <>
              <button onClick={() => setView('picker')} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                Change template
              </button>
              <button onClick={handleReset} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <RotateCcw size={12} /> Reset
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: saved ? '#10B981' : 'var(--color-primary)', fontSize: 12, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                {saved ? <><Check size={12} /> Saved</> : saving ? 'Saving…' : <><Save size={12} /> Save layout</>}
              </button>
            </>
          )}
          {view === 'invoice-view' && (
            <button onClick={() => setView(selectedTemplate ? 'editor' : 'picker')} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              Edit layout
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', fontSize: 12, color: 'white', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Download size={12} /> {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ── Views ── */}
      {view === 'invoice-view' && (
        <InvoiceView
          invoice={invoice}
          user={user}
          selectedTemplate={selectedTemplate}
          scale={scale}
          onEditLayout={() => setView(selectedTemplate ? 'editor' : 'picker')}
        />
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Template Picker */}
        {view === 'picker' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>Choose a template</h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 28px' }}>Pick a layout for your invoice PDF.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {templates.map(tpl => (
                  <TemplateCard key={tpl._id} template={tpl} selected={selectedTemplate?._id === tpl._id} onSelect={handleSelectTemplate} />
                ))}
                <label style={{ border: '2px dashed var(--color-border)', borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 200, backgroundColor: 'var(--color-bg)' }}>
                  <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleCustomUpload} style={{ display: 'none' }} />
                  {uploadingTemplate
                    ? <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Scanning template…</div>
                    : <>
                        <Upload size={22} color="var(--color-text-muted)" />
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Upload template</p>
                          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>PDF or image, max 10MB</p>
                        </div>
                      </>
                  }
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        {view === 'editor' && (
          <>
            {/* Sidebar */}
            <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', overflowY: 'auto', padding: '16px 12px' }}>
              <p style={{ margin: '0 0 12px 4px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fields — drag to reposition
              </p>
              {fields.map(f => {
                const val = fieldValues[f.key]
                return (
                  <div
                    key={f.key}
                    onClick={() => setSelectedField(f.key === selectedField ? null : f.key)}
                    style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', backgroundColor: selectedField === f.key ? 'rgba(37,99,235,0.08)' : 'transparent', border: `1px solid ${selectedField === f.key ? 'var(--color-primary)' : 'transparent'}` }}
                  >
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{f.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {val || <span style={{ fontStyle: 'italic' }}>empty</span>}
                    </p>
                  </div>
                )
              })}

              {selectedField && (() => {
                const f = fields.find(fi => fi.key === selectedField)
                if (!f) return null
                return (
                  <div style={{ marginTop: 16, padding: '12px', borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Position</p>
                    {[{ label: 'X', key: 'x' }, { label: 'Y', key: 'y' }, { label: 'Width', key: 'width' }, { label: 'Font size', key: 'fontSize' }].map(({ label, key }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</label>
                        <input
                          type="number"
                          value={Math.round(f[key])}
                          onChange={e => setFields(prev => prev.map(fi => fi.key === selectedField ? { ...fi, [key]: Number(e.target.value) } : fi))}
                          style={{ width: 70, padding: '4px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', outline: 'none' }}
                        />
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Bold</label>
                      <button
                        onClick={() => setFields(prev => prev.map(fi => fi.key === selectedField ? { ...fi, fontWeight: fi.fontWeight === 'bold' ? 'normal' : 'bold' } : fi))}
                        style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, border: '1px solid var(--color-border)', backgroundColor: f.fontWeight === 'bold' ? 'var(--color-primary)' : 'transparent', color: f.fontWeight === 'bold' ? 'white' : 'var(--color-text-secondary)', cursor: 'pointer' }}
                      >
                        {f.fontWeight === 'bold' ? 'Yes' : 'No'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Align</label>
                      <select
                        value={f.align}
                        onChange={e => setFields(prev => prev.map(fi => fi.key === selectedField ? { ...fi, align: e.target.value } : fi))}
                        style={{ padding: '3px 6px', borderRadius: 6, fontSize: 11, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', outline: 'none' }}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Canvas */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 32, display: 'flex', justifyContent: 'center', backgroundColor: '#E5E7EB' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Drag fields to reposition them on the invoice</p>
                <div
                  ref={canvasRef}
                  style={{ width: A4_WIDTH_PX * scale, height: A4_HEIGHT_PX * scale, backgroundColor: 'white', position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}
                  onClick={() => setSelectedField(null)}
                >
                  {selectedTemplate?.backgroundUrl && (
                    <img src={selectedTemplate.backgroundUrl} alt="Template background"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0.3 }} />
                  )}
                  {!selectedTemplate?.backgroundUrl && getTemplateId(selectedTemplate) === 'classic' && <ClassicBackground scale={scale} />}
                  {!selectedTemplate?.backgroundUrl && getTemplateId(selectedTemplate) === 'minimal' && <MinimalBackground scale={scale} />}

                  {fields.map(f => (
                    <DraggableField
                      key={f.key}
                      field={f}
                      value={fieldValues[f.key]}
                      scale={scale}
                      isSelected={selectedField === f.key}
                      onSelect={setSelectedField}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Background components ──────────────────────────────────────────────────
const ClassicBackground = ({ scale }) => (
  <>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 120 * scale, backgroundColor: '#111827' }} />
    <div style={{ position: 'absolute', top: 140 * scale, left: 48 * scale, fontSize: 28 * scale * 0.55, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>INVOICE</div>
    <div style={{ position: 'absolute', top: 210 * scale, left: 48 * scale, right: 48 * scale, height: 1, backgroundColor: '#E5E7EB' }} />
    <div style={{ position: 'absolute', top: 220 * scale, left: 48 * scale, fontSize: 8 * scale * 0.9, fontWeight: 600, color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase' }}>BILL TO</div>
    <div style={{ position: 'absolute', top: 290 * scale, left: 48 * scale, right: 48 * scale, height: 24 * scale, backgroundColor: '#F3F4F6' }} />
    <div style={{ position: 'absolute', bottom: 30 * scale, left: 48 * scale, right: 48 * scale, height: 1, backgroundColor: '#E5E7EB' }} />
    <div style={{ position: 'absolute', bottom: 16 * scale, left: 0, right: 0, fontSize: 7 * scale * 0.9, color: '#D1D5DB', textAlign: 'center' }}>Powered by Aethr</div>
  </>
)

const MinimalBackground = ({ scale }) => (
  <>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4 * scale, backgroundColor: '#111827' }} />
    <div style={{ position: 'absolute', top: 260 * scale, left: 48 * scale, right: 48 * scale, height: 1, backgroundColor: '#111827' }} />
    <div style={{ position: 'absolute', top: 265 * scale, left: 48 * scale, fontSize: 7 * scale * 0.9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>DESCRIPTION</div>
    <div style={{ position: 'absolute', top: 265 * scale, right: 48 * scale, fontSize: 7 * scale * 0.9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>AMOUNT</div>
    <div style={{ position: 'absolute', top: 500 * scale, left: 48 * scale, right: 48 * scale, height: 1, backgroundColor: '#E5E7EB' }} />
    <div style={{ position: 'absolute', bottom: 40 * scale, left: 48 * scale, right: 48 * scale, height: 1, backgroundColor: '#E5E7EB' }} />
    <div style={{ position: 'absolute', bottom: 24 * scale, left: 0, right: 0, fontSize: 7 * scale * 0.9, color: '#D1D5DB', textAlign: 'center' }}>Powered by Aethr</div>
  </>
)

export default InvoicePreview