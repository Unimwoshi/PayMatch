import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  Building2,
  Phone,
  Landmark,
  DollarSign,
  ImagePlus,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react'

const steps = [
  { id: 1, title: 'Business details', icon: Building2 },
  { id: 2, title: 'Contact & address', icon: Phone },
  { id: 3, title: 'Bank details', icon: Landmark },
  { id: 4, title: 'Preferences', icon: DollarSign },
  { id: 5, title: 'Logo upload', icon: ImagePlus },
  { id: 6, title: 'All done', icon: CheckCircle },
]

const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)'
}

const labelStyle = { color: 'var(--color-text-secondary)' }

const Onboarding = () => {
  const { updateUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)

  const [form, setForm] = useState({
    businessName: '',
    address: '',
    phone: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    currency: 'NGN',
    vatEnabled: true
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    setError('')
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleNext = () => {
    setError('')
    if (step === 1 && !form.businessName) {
      return setError('Please enter your business name')
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setError('')
    setStep(step - 1)
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/onboarding', form)
      updateUser(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (logoFile) {
        const formData = new FormData()
        formData.append('logo', logoFile)
        await api.post('/auth/onboarding/logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      const { data } = await api.post('/auth/onboarding', form)
      updateUser(data)
      setStep(6)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const progress = ((step - 1) / (steps.length - 1)) * 100

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Fyn<span style={{ color: 'var(--color-primary)' }}>lo</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Let's set up your business
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Step {step} of {steps.length}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {steps[step - 1].title}
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--color-primary)'
              }}
            />
          </div>
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
                color: 'var(--color-danger)'
              }}
            >
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  What's your business called?
                </h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  This appears on all your invoices
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                  Business name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="Okafor Supplies Ltd"
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Contact & address
                </h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Used on invoices and for client communication
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                  Phone number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+234 801 234 5678"
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                  Business address
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="12 Broad Street, Lagos Island"
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Bank details
                </h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Displayed on invoices so clients know where to pay
                </p>
              </div>
              {[
                { label: 'Bank name', name: 'bankName', placeholder: 'Zenith Bank' },
                { label: 'Account number', name: 'accountNumber', placeholder: '2012345678' },
                { label: 'Account name', name: 'accountName', placeholder: 'Okafor Supplies Ltd' },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                    {label}
                  </label>
                  <input
                    type="text"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Preferences
                </h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Set your defaults — you can always change these later
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
                  Default currency
                </label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="NGN">NGN — Nigerian Naira (₦)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                  <option value="CNY">CNY — Chinese Yuan (¥)</option>
                </select>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Enable VAT by default
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Adds 7.5% VAT to all invoices automatically
                  </p>
                </div>
                <button
                  onClick={() => setForm({ ...form, vatEnabled: !form.vatEnabled })}
                  className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
                  style={{ backgroundColor: form.vatEnabled ? 'var(--color-primary)' : 'var(--color-border)' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200"
                    style={{ transform: form.vatEnabled ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Business logo
                </h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Appears on your invoices. PNG or JPG, max 2MB
                </p>
              </div>
              <div
                className="relative flex flex-col items-center justify-center rounded-xl p-8 cursor-pointer transition-all"
                style={{ border: '2px dashed var(--color-border)' }}
                onClick={() => document.getElementById('logo-input').click()}
              >
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 object-contain rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setLogoPreview(null)
                        setLogoFile(null)
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImagePlus size={32} style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>
                      Click to upload your logo
                    </p>
                  </>
                )}
                <input
                  id="logo-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                You can skip this and add it later in Settings
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="text-center space-y-4 py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'var(--color-success-bg)' }}
              >
                <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                You're all set!
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Your business profile is ready. Let's go to your dashboard.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-4"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Go to dashboard
              </button>
            </div>
          )}

          {step < 6 && (
            <div className="flex items-center justify-between mt-8">
                <button
                onClick={step === 1 ? handleSkip : handleBack}
                className="flex items-center gap-1.5 text-sm"
                style={{ color: 'var(--color-text-muted)' }}
                >
                {step === 1 ? (
                    'Skip setup'
                ) : (
                    <>
                    <ChevronLeft size={15} />
                    Back
                    </>
                )}
                </button>

                <div className="flex items-center gap-3">
                {step > 1 && (
                    <button
                    onClick={handleSkip}
                    className="text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                    >
                    Skip setup
                    </button>
                )}

                {step < 5 ? (
                    <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                    Continue
                    <ChevronRight size={15} />
                    </button>
                ) : (
                    <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                    {loading ? 'Saving...' : 'Finish setup'}
                    <ChevronRight size={15} />
                    </button>
                )}
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  )
}

export default Onboarding