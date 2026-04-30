import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { User } from 'lucide-react'

const Profile = () => {
  const { user, login, token } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    email: user?.email || ''
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return setError('Name cannot be empty')
    setLoading(true)
    try {
      const { data } = await api.put('/auth/profile', form)
      login(data, token)
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Profile
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Manage your personal information
        </p>
      </div>

      <div
        className="rounded-2xl p-6 mb-6 flex items-center gap-4"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{user?.name}</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user?.businessName}</p>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {success && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
          >
            {success}
          </div>
        )}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: 'Full name', name: 'name', type: 'text', placeholder: 'Emeka Okafor' },
            { label: 'Business name', name: 'businessName', type: 'text', placeholder: 'Okafor Supplies Ltd' },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'you@business.com' },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile