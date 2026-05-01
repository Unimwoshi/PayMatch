import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  GitMerge,
  FileText,
  CreditCard,
  AlertCircle,
  Info
} from 'lucide-react'

const typeIcon = (type) => {
  const props = { size: 14 }
  switch (type) {
    case 'match_found':
    case 'match_confirmed': return <GitMerge {...props} />
    case 'invoice_created':
    case 'invoice_overdue': return <FileText {...props} />
    case 'payment_received': return <CreditCard {...props} />
    case 'budget_exceeded': return <AlertCircle {...props} />
    default: return <Info {...props} />
  }
}

const typeColor = (type) => {
  switch (type) {
    case 'invoice_overdue':
    case 'budget_exceeded': return 'var(--color-danger)'
    case 'match_found':
    case 'payment_received': return 'var(--color-success)'
    case 'match_confirmed': return 'var(--color-primary)'
    default: return 'var(--color-text-muted)'
  }
}

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const NotificationPanel = ({ onClose }) => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications()
  const navigate = useNavigate()
  const panelRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsRead(notification._id)
    if (notification.link) {
      navigate(notification.link)
      onClose()
    }
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: 'var(--color-text-primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Mark all as read"
            >
              <CheckCheck size={15} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} title="Clear all">
              <Trash2 size={15} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
          <button onClick={onClose}>
            <X size={15} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-8">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--color-primary)' }}
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all"
              style={{
                backgroundColor: n.read ? 'transparent' : 'var(--color-primary-muted)',
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: typeColor(n.type) + '18',
                  color: typeColor(n.type)
                }}
              >
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {n.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {n.message}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
                  {timeAgo(n.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNotification(n._id)
                }}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100"
              >
                <X size={12} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationPanel