import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import ThemeToggle from './ThemeToggle'
import NotificationPanel from './NotificationPanel'
import { Bell } from 'lucide-react'

const Topbar = ({ title }) => {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const [showPanel, setShowPanel] = useState(false)

  return (
    <div
      className="flex items-center justify-between px-4 md:px-8 py-4 sticky top-0 z-10"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm hidden md:block" style={{ color: 'var(--color-text-muted)' }}>
          {user?.businessName || user?.name}
        </span>

        <div className="relative">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  fontSize: '9px',
                  fontWeight: 500
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showPanel && (
            <NotificationPanel onClose={() => setShowPanel(false)} />
          )}
        </div>

        <ThemeToggle />
      </div>
    </div>
  )
}

export default Topbar