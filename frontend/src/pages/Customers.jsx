import { useEffect, useState } from 'react'
import api from '../api/axios'
import {
  Plus,
  X,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  TrendingUp
} from 'lucide-react'

const formatNaira = (amount) => {
  if (!amount) return '₦0'
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`
  return `₦${amount}`
}

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    currency: 'NGN',
    paymentTerms: 'Net 30',
    notes: ''
  })

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers')
      setCustomers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return setError('Customer name is required')
    setSubmitting(true)
    try {
      await api.post('/customers', form)
      setShowModal(false)
      setForm({
        name: '', contactPerson: '', phone: '',
        email: '', address: '', currency: 'NGN',
        paymentTerms: 'Net 30', notes: ''
      })
      fetchCustomers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/customers/${id}`)
      setSelected(null)
      fetchCustomers()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const reliabilityColor = (score) => {
    if (score >= 80) return 'var(--color-success)'
    if (score >= 50) return 'var(--color-warning)'
    return 'var(--color-danger)'
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Customers
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {customers.length} client{customers.length !== 1 ? 's' : ''} in your directory
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={15} />
          Add client
        </button>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-6"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: 'var(--color-text-primary)' }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-16 text-center"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <User size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {search ? 'No clients match your search' : 'Your client directory is empty'}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {search ? 'Try a different name or email' : 'Add your first client to get started'}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Add your first client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer) => (
            <div
              key={customer._id}
              onClick={() => setSelected(customer)}
              className="rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {customer.name}
                    </p>
                    {customer.contactPerson && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {customer.contactPerson}
                      </p>
                    )}
                  </div>
                </div>
                {customer.reliabilityScore !== undefined && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: reliabilityColor(customer.reliabilityScore),
                      backgroundColor: reliabilityColor(customer.reliabilityScore) + '18'
                    }}
                  >
                    {customer.reliabilityScore}%
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {customer.phone}
                    </span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {customer.email}
                    </span>
                  </div>
                )}
              </div>

              <div
                className="flex items-center justify-between mt-4 pt-3"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total invoiced</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {formatNaira(customer.totalInvoiced)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Outstanding</p>
                  <p className="text-sm font-medium" style={{ color: customer.totalOutstanding > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {formatNaira(customer.totalOutstanding)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {selected.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {selected.paymentTerms}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelected(null)}>
                <X size={18} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {selected.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {selected.phone}
                  </span>
                </div>
              )}
              {selected.email && (
                <div className="flex items-center gap-3">
                  <Mail size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {selected.email}
                  </span>
                </div>
              )}
              {selected.address && (
                <div className="flex items-center gap-3">
                  <MapPin size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {selected.address}
                  </span>
                </div>
              )}
            </div>

            <div
              className="grid grid-cols-3 gap-3 p-4 rounded-xl mb-6"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Invoiced</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatNaira(selected.totalInvoiced)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Paid</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                  {formatNaira(selected.totalPaid)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Overdue</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
                  {formatNaira(selected.totalOutstanding)}
                </p>
              </div>
            </div>

            {selected.notes && (
              <div
                className="p-3 rounded-lg mb-4 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                {selected.notes}
              </div>
            )}

            <div className="flex gap-3">
              {selected.phone && (
                
                  href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center text-white"
                  style={{ backgroundColor: '#25D366' }}
                >
                  WhatsApp
                </a>
              )}
              <button
                onClick={() => handleDelete(selected._id)}
                className="px-4 py-2.5 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Add client
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
                { label: 'Business / client name', name: 'name', type: 'text', placeholder: 'Dangote Cement' },
                { label: 'Contact person', name: 'contactPerson', type: 'text', placeholder: 'Aliko Dangote' },
                { label: 'Phone (WhatsApp)', name: 'phone', type: 'tel', placeholder: '+234 801 234 5678' },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'contact@dangote.com' },
                { label: 'Address', name: 'address', type: 'text', placeholder: '1 Dangote Close, Abuja' },
              ].map(({ label, name, type, placeholder }) => (
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
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Payment terms
                </label>
                <select
                  name="paymentTerms"
                  value={form.paymentTerms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="Due on receipt">Due on receipt</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 14">Net 14</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="e.g. Prefers invoices on Fridays"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>

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
                  {submitting ? 'Adding...' : 'Add client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers