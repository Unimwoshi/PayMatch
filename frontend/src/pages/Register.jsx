import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
  e.preventDefault()

  if (!form.email) return setError('Please enter your email address')
  if (!/\S+@\S+\.\S+/.test(form.email)) return setError('Please enter a valid email address')
  if (!form.password) return setError('Please enter your password')
  if (form.password.length < 6) return setError('Password must be at least 6 characters')

  setLoading(true)
  try {
    const { data } = await api.post('/auth/register', form)
    login(data, data.token)
    navigate('/onboarding')
  } catch (err) {
    setError(err.response?.data?.message || 'Registration failed. Try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Ae<span style={{ color: 'var(--color-primary)' }}>thr</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Create your account
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Full name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Emeka Okafor"
                
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Business name
              </label>
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                placeholder="Okafor Supplies Ltd"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@business.com"
                
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium"
              style={{ color: 'var(--color-primary)' }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register