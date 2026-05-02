import { useEffect, useState } from 'react'
import api from '../api/axios'
import { Plus } from 'lucide-react'
import CreateInvoiceModal from '../components/CreateInvoiceModal.jsx'
import { useNavigate } from 'react-router-dom'

const formatCurrency = (amount, currency = 'NGN') => {
  const symbols = { NGN: '₦', USD: '$', GBP: '£', CNY: '¥' }
  const sym = symbols[currency] || currency
  if (amount === undefined || amount === null) return `${sym}0`
  if (amount >= 1000000) return `${sym}${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${sym}${(amount / 1000).toFixed(0)}K`
  return `${sym}${amount}`
}

const statusColors = {
  unpaid: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
  partial: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  paid: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
}

const Invoices = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices')
      setInvoices(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoices() }, [])

  const handleCreated = (newInvoice) => {
    setInvoices(prev => [newInvoice, ...prev])
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Invoices
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={15} />
          New invoice
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)' }}
          />
        </div>
      ) : invoices.length === 0 ? (
        <div
          className="rounded-xl p-16 text-center"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No invoices yet. Create your first one.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  {['Invoice #', 'Customer', 'Amount', 'Balance', 'Due date', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr
                    key={inv._id}
                    style={{
                      backgroundColor: i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/invoices/${inv._id}/preview`)}
                  >
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {inv.invoiceNumber || '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {inv.customerName}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(inv.amount, inv.currency)}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatCurrency(inv.remainingBalance, inv.currency)}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-NG') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                        style={{
                          color: statusColors[inv.status]?.color,
                          backgroundColor: statusColors[inv.status]?.bg
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-primary)' }}>
                      View →
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <CreateInvoiceModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
          api={api}
        />
      )}
    </div>
  )
}

export default Invoices