import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, Bell, Shield, Trash2 } from 'lucide-react'

const SettingRow = ({ label, description, children }) => (
  <div
    className="flex items-center justify-between py-4 border-b last:border-0"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="flex-1 pr-8">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
      {description && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
      )}
    </div>
    {children}
  </div>
)

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
    style={{ backgroundColor: value ? 'var(--color-primary)' : 'var(--color-border)' }}
  >
    <span
      className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200"
      style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
    />
  </button>
)

const Settings = () => {
  const { dark, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    overdueAlerts: true,
    matchAlerts: true,
    weeklyReport: false
  })
  const [currency, setCurrency] = useState('NGN')

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Manage your app preferences
        </p>
      </div>

      <div className="space-y-6">
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sun size={15} style={{ color: 'var(--color-text-muted)' }} />
            <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Appearance
            </h2>
          </div>
          <SettingRow
            label="Dark mode"
            description="Switch between light and dark theme"
          >
            <Toggle value={dark} onChange={toggleTheme} />
          </SettingRow>
          <SettingRow
            label="Currency"
            description="Default currency for display"
          >
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="NGN">NGN — ₦</option>
              <option value="USD">USD — $</option>
              <option value="GBP">GBP — £</option>
              <option value="EUR">EUR — €</option>
            </select>
          </SettingRow>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell size={15} style={{ color: 'var(--color-text-muted)' }} />
            <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Notifications
            </h2>
          </div>
          <SettingRow
            label="Overdue alerts"
            description="Get notified when invoices pass their due date"
          >
            <Toggle
              value={notifications.overdueAlerts}
              onChange={(v) => setNotifications({ ...notifications, overdueAlerts: v })}
            />
          </SettingRow>
          <SettingRow
            label="Match alerts"
            description="Get notified when new reconciliation matches are found"
          >
            <Toggle
              value={notifications.matchAlerts}
              onChange={(v) => setNotifications({ ...notifications, matchAlerts: v })}
            />
          </SettingRow>
          <SettingRow
            label="Weekly report"
            description="Receive a weekly summary of your finances"
          >
            <Toggle
              value={notifications.weeklyReport}
              onChange={(v) => setNotifications({ ...notifications, weeklyReport: v })}
            />
          </SettingRow>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} style={{ color: 'var(--color-text-muted)' }} />
            <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Security
            </h2>
          </div>
          <SettingRow
            label="Change password"
            description="Update your account password"
          >
            <button
              className="text-sm px-4 py-1.5 rounded-lg"
              style={{
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Update
            </button>
          </SettingRow>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Trash2 size={15} style={{ color: 'var(--color-danger)' }} />
            <h2 className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
              Danger zone
            </h2>
          </div>
          <SettingRow
            label="Delete account"
            description="Permanently delete your account and all data. This cannot be undone."
          >
            <button
              className="text-sm px-4 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)'
              }}
            >
              Delete
            </button>
          </SettingRow>
        </div>
      </div>
    </div>
  )
}

export default Settings