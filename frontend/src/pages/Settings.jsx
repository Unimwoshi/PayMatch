import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  Building2, CreditCard, Bell, Download,
  Key, Save, Eye, EyeOff, AlertTriangle, Check
} from 'lucide-react'

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

const SectionCard = ({ title, icon: Icon, children }) => (
  <div style={{
    borderRadius: 12, border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-card)', overflow: 'hidden', marginBottom: 16,
  }}>
    <div style={{
      padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <Icon size={16} color="var(--color-primary)" />
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</h3>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
)

const Toggle = ({ enabled, onToggle, label, description }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
    <div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</p>
      {description && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{description}</p>}
    </div>
    <button onClick={onToggle} style={{
      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
      backgroundColor: enabled ? 'var(--color-primary)' : 'var(--color-border)',
      position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: enabled ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', backgroundColor: 'white',
        transition: 'left 0.2s',
      }} />
    </button>
  </div>
)

const SaveButton = ({ saving, saved, onClick, label = 'Save changes' }) => (
  <button onClick={onClick} disabled={saving} style={{
    marginTop: 16, padding: '9px 20px', borderRadius: 8, border: 'none',
    backgroundColor: saved ? 'var(--color-success)' : 'var(--color-primary)',
    color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  }}>
    {saved ? <><Check size={13} /> Saved</> : saving ? 'Saving...' : <><Save size={13} /> {label}</>}
  </button>
)

const Settings = () => {
  const { user, updateUser } = useAuth()
  const [activeSection, setActiveSection] = useState('business')

  // Business profile state
  const [profile, setProfile] = useState({
    businessName: '', address: '', phone: '', currency: 'NGN', vatEnabled: false,
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Bank details state
  const [bank, setBank] = useState({ bankName: '', accountNumber: '', accountName: '' })
  const [bankSaving, setBankSaving] = useState(false)
  const [bankSaved, setBankSaved] = useState(false)

  // Payment keys state
  const [paystackKey, setPaystackKey] = useState({ secret: '', public: '' })
  const [flutterwaveKey, setFlutterwaveKey] = useState({ secret: '', public: '' })
  const [showSecrets, setShowSecrets] = useState({ paystack: false, flutterwave: false })
  const [keysSaving, setKeysSaving] = useState(false)
  const [keysSaved, setKeysSaved] = useState(false)

  // Notification state
  const [notifications, setNotifications] = useState({ weeklyEmail: true })
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  // Export state
  const [exporting, setExporting] = useState(false)

  // Error
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setProfile({
        businessName: user.businessName || '',
        address: user.businessDetails?.address || '',
        phone: user.businessDetails?.phone || '',
        currency: user.businessDetails?.currency || 'NGN',
        vatEnabled: user.businessDetails?.vatEnabled || false,
      })
      setBank({
        bankName: user.businessDetails?.bankName || '',
        accountNumber: user.businessDetails?.accountNumber || '',
        accountName: user.businessDetails?.accountName || '',
      })
      setNotifications({
        weeklyEmail: user.weeklyEmailEnabled !== false,
      })
    }
  }, [user])

  const saveProfile = async () => {
    setProfileSaving(true)
    setError('')
    try {
      const { data } = await api.put('/auth/profile', {
        businessName: profile.businessName,
        businessDetails: {
          ...user.businessDetails,
          address: profile.address,
          phone: profile.phone,
          currency: profile.currency,
          vatEnabled: profile.vatEnabled,
        }
      })
      updateUser(data)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const saveBank = async () => {
    setBankSaving(true)
    setError('')
    try {
      const { data } = await api.put('/auth/profile', {
        businessDetails: {
          ...user.businessDetails,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          accountName: bank.accountName,
        }
      })
      updateUser(data)
      setBankSaved(true)
      setTimeout(() => setBankSaved(false), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bank details')
    } finally {
      setBankSaving(false)
    }
  }

  const savePaystackKeys = async () => {
    if (!paystackKey.secret) return
    setKeysSaving(true)
    try {
      await api.post('/payment-links/keys', {
        provider: 'paystack',
        secretKey: paystackKey.secret,
        publicKey: paystackKey.public,
      })
      setKeysSaved(true)
      setTimeout(() => setKeysSaved(false), 2500)
    } catch (err) {
      setError('Failed to save Paystack keys')
    } finally {
      setKeysSaving(false)
    }
  }

  const saveFlutterwaveKeys = async () => {
    if (!flutterwaveKey.secret) return
    setKeysSaving(true)
    try {
      await api.post('/payment-links/keys', {
        provider: 'flutterwave',
        secretKey: flutterwaveKey.secret,
        publicKey: flutterwaveKey.public,
      })
      setKeysSaved(true)
      setTimeout(() => setKeysSaved(false), 2500)
    } catch (err) {
      setError('Failed to save Flutterwave keys')
    } finally {
      setKeysSaving(false)
    }
  }

  const saveNotifications = async () => {
    setNotifSaving(true)
    try {
      await api.put('/auth/profile', { weeklyEmailEnabled: notifications.weeklyEmail })
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 2500)
    } catch (err) {
      setError('Failed to save notification settings')
    } finally {
      setNotifSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await api.get('/export/all', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `aether-export-${new Date().toISOString().split('T')[0]}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const sections = [
    { key: 'business', label: 'Business', icon: Building2 },
    { key: 'bank', label: 'Bank details', icon: CreditCard },
    { key: 'payments', label: 'Payment integrations', icon: Key },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'export', label: 'Data & export', icon: Download },
  ]

  return (
    <div className="p-4 md:p-8">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
          Manage your business profile and preferences
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar nav */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                marginBottom: 4, textAlign: 'left', fontSize: 13,
                backgroundColor: activeSection === key ? 'rgba(37,99,235,0.08)' : 'transparent',
                color: activeSection === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeSection === key ? 600 : 400,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Business profile */}
          {activeSection === 'business' && (
            <SectionCard title="Business Profile" icon={Building2}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Business name</label>
                  <input value={profile.businessName}
                    onChange={e => setProfile({ ...profile, businessName: e.target.value })}
                    placeholder="Aether Technologies Ltd" style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Business address</label>
                  <input value={profile.address}
                    onChange={e => setProfile({ ...profile, address: e.target.value })}
                    placeholder="12 Broad Street, Lagos Island" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+234 801 234 5678" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Default currency</label>
                  <select value={profile.currency}
                    onChange={e => setProfile({ ...profile, currency: e.target.value })}
                    style={inputStyle}>
                    <option value="NGN">NGN — Naira (₦)</option>
                    <option value="USD">USD — Dollar ($)</option>
                    <option value="GBP">GBP — Pound (£)</option>
                    <option value="CNY">CNY — Yuan (¥)</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Enable VAT by default</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>Adds 7.5% VAT to all new invoices automatically</p>
                </div>
                <button onClick={() => setProfile({ ...profile, vatEnabled: !profile.vatEnabled })}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    backgroundColor: profile.vatEnabled ? 'var(--color-primary)' : 'var(--color-border)',
                    position: 'relative', flexShrink: 0,
                  }}>
                  <span style={{ position: 'absolute', top: 2, left: profile.vatEnabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s' }} />
                </button>
              </div>
              <SaveButton saving={profileSaving} saved={profileSaved} onClick={saveProfile} />
            </SectionCard>
          )}

          {/* Bank details */}
          {activeSection === 'bank' && (
            <SectionCard title="Bank Details" icon={CreditCard}>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                These appear on all your invoices so clients know where to pay.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Bank name', key: 'bankName', placeholder: 'Zenith Bank' },
                  { label: 'Account number', key: 'accountNumber', placeholder: '2012345678' },
                  { label: 'Account name', key: 'accountName', placeholder: 'Aether Technologies Ltd' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input value={bank[key]}
                      onChange={e => setBank({ ...bank, [key]: e.target.value })}
                      placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
              </div>
              <SaveButton saving={bankSaving} saved={bankSaved} onClick={saveBank} />
            </SectionCard>
          )}

          {/* Payment integrations */}
          {activeSection === 'payments' && (
            <>
              <SectionCard title="Paystack" icon={Key}>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Connect your Paystack account to generate payment links. Money goes directly to your account — Aether never touches your funds.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Secret key', key: 'secret', placeholder: 'sk_live_...' },
                    { label: 'Public key', key: 'public', placeholder: 'pk_live_...' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showSecrets.paystack ? 'text' : 'password'}
                          value={paystackKey[key]}
                          onChange={e => setPaystackKey({ ...paystackKey, [key]: e.target.value })}
                          placeholder={placeholder}
                          style={{ ...inputStyle, paddingRight: 36 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets(p => ({ ...p, paystack: !p.paystack }))}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                        >
                          {showSecrets.paystack ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <SaveButton saving={keysSaving} saved={keysSaved} onClick={savePaystackKeys} label="Save Paystack keys" />
              </SectionCard>

              <SectionCard title="Flutterwave" icon={Key}>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Alternatively connect Flutterwave — especially useful for international payments.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Secret key', key: 'secret', placeholder: 'FLWSECK_TEST-...' },
                    { label: 'Public key', key: 'public', placeholder: 'FLWPUBK_TEST-...' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showSecrets.flutterwave ? 'text' : 'password'}
                          value={flutterwaveKey[key]}
                          onChange={e => setFlutterwaveKey({ ...flutterwaveKey, [key]: e.target.value })}
                          placeholder={placeholder}
                          style={{ ...inputStyle, paddingRight: 36 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets(p => ({ ...p, flutterwave: !p.flutterwave }))}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                        >
                          {showSecrets.flutterwave ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <SaveButton saving={keysSaving} saved={keysSaved} onClick={saveFlutterwaveKeys} label="Save Flutterwave keys" />
              </SectionCard>
            </>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <SectionCard title="Notifications & Emails" icon={Bell}>
              <Toggle
                enabled={notifications.weeklyEmail}
                onToggle={() => setNotifications(n => ({ ...n, weeklyEmail: !n.weeklyEmail }))}
                label="Weekly business snapshot email"
                description="Receive a summary every Monday morning with revenue, expenses, and overdue invoices"
              />
              <div style={{ paddingTop: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Emails are sent from noreply@aether.com.ng. In-app notifications are always enabled.
                </p>
              </div>
              <SaveButton saving={notifSaving} saved={notifSaved} onClick={saveNotifications} />
            </SectionCard>
          )}

          {/* Data & export */}
          {activeSection === 'export' && (
            <SectionCard title="Data & Export" icon={Download}>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Export all your business data as a ZIP file containing CSVs of your invoices, payments, expenses, and customers. Your data always belongs to you.
              </p>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  backgroundColor: 'var(--color-primary)', color: 'white',
                  fontSize: 13, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, opacity: exporting ? 0.7 : 1,
                }}
              >
                <Download size={14} />
                {exporting ? 'Preparing export...' : 'Export all my data'}
              </button>

              <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={15} color="var(--color-danger)" />
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-danger)' }}>Danger zone</h4>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Deleting your account is permanent and cannot be undone. All your data will be erased.
                </p>
                <button style={{
                  padding: '9px 16px', borderRadius: 8,
                  border: '1px solid var(--color-danger)',
                  backgroundColor: 'transparent', color: 'var(--color-danger)',
                  fontSize: 13, cursor: 'pointer',
                }}>
                  Delete my account
                </button>
              </div>
            </SectionCard>
          )}

        </div>
      </div>
    </div>
  )
}

export default Settings