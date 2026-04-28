import { useEffect, useState } from 'react'
import api from '../api/axios'
import { Plus, X } from 'lucide-react'

const formatNaira = (amount) => {
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`
  return `₦${amount}`
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
  const [form, setForm] = useState({
    invoiceNumber: '',
    customerName: '',
    amount: '',
    issueDate: '',
    dueDate: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/invoices', { ...form, amount: Number(form.amount) })
      setShowModal(false)
      setForm({ invoiceNumber: '', customerName: '', amount: '', issueDate: '', dueDate: '', description: '' })
      fetchInvoices()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Invoices
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {invoices.length} total invoices
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
        > <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                {['Invoice #', 'Customer', 'Amount', 'Balance', 'Due date', 'Status'].map((h) => (
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
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {inv.invoiceNumber || '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {inv.customerName}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {formatNaira(inv.amount)}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatNaira(inv.remainingBalance)}
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
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                New invoice
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={18} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Invoice number', name: 'invoiceNumber', type: 'text', placeholder: 'INV-001' },
                { label: 'Customer name', name: 'customerName', type: 'text', placeholder: 'Dangote Cement', required: true },
                { label: 'Amount (₦)', name: 'amount', type: 'number', placeholder: '150000', required: true },
                { label: 'Issue date', name: 'issueDate', type: 'date', required: true },
                { label: 'Due date', name: 'dueDate', type: 'date' },
                { label: 'Description', name: 'description', type: 'text', placeholder: 'Supply of materials' },
              ].map(({ label, name, type, placeholder, required }) => (
                <div key={name}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {submitting ? 'Creating...' : 'Create invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Invoices