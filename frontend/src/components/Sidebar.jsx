import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  LayoutDashboard, FileText, CreditCard, GitMerge,
  LogOut, ChevronLeft, ChevronRight, Settings,
  Users, Receipt, Bell, X, MoreHorizontal
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',      label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/invoices',       label: 'Invoices',     icon: FileText },
  { to: '/payments',       label: 'Payments',     icon: CreditCard },
  { to: '/customers',      label: 'Customers',    icon: Users },
  { to: '/receipts',       label: 'Expenses',     icon: Receipt },
  { to: '/reminders',      label: 'Reminders',    icon: Bell },
  { to: '/reconciliation', label: 'Reconcile',    icon: GitMerge },
  { to: '/settings',       label: 'Settings',     icon: Settings },
]

// Primary 4 shown in mobile bottom nav
const mobileNavPrimary = ['/dashboard', '/invoices', '/payments', '/customers']

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      style={{
        backgroundColor: 'var(--color-bg-sidebar)',
        width: collapsed ? '64px' : '220px',
        transition: 'width 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        minWidth: collapsed ? '64px' : '220px'
      }}
      className="flex flex-col h-screen overflow-hidden relative"
    >
      <div className="flex items-center justify-between px-4 py-5">
        <span
          className="text-white font-semibold text-lg tracking-tight overflow-hidden whitespace-nowrap"
          style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            transition: 'opacity 0.2s ease, width 0.3s ease'
          }}
        >
          Ae<span style={{ color: 'var(--color-primary-bright)' }}>ther</span>
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ml-auto flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          {collapsed
            ? <ChevronRight size={14} className="text-white opacity-70" />
            : <ChevronLeft size={14} className="text-white opacity-70" />
          }
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 text-sm overflow-hidden whitespace-nowrap
              ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`
            }
            style={({ isActive }) =>
              isActive ? { backgroundColor: 'var(--color-bg-sidebar-active)' } : {}
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            <span
              className="ml-3 overflow-hidden whitespace-nowrap"
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : '200px',
                transition: 'opacity 0.2s ease, max-width 0.3s ease'
              }}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-4 space-y-1">
        <NavLink
          to="/profile"
          className="flex items-center px-3 py-2.5 rounded-lg w-full transition-all duration-150 overflow-hidden whitespace-nowrap hover:bg-white/5"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div
            className="ml-3 overflow-hidden"
            style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : '200px',
              transition: 'opacity 0.2s ease, max-width 0.3s ease'
            }}
          >
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-white/40 text-xs truncate">{user?.businessName || user?.email}</p>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2.5 rounded-lg w-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-150 text-sm overflow-hidden whitespace-nowrap"
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span
            className="ml-3"
            style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : '200px',
              transition: 'opacity 0.2s ease, max-width 0.3s ease'
            }}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  )
}

export const MobileNav = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)

  const primaryItems = navItems.filter(item => mobileNavPrimary.includes(item.to))
  const moreItems = navItems.filter(item => !mobileNavPrimary.includes(item.to))

  return (
    <>
      {/* More tray — slides up from bottom */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMore(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 48,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          />
          {/* Tray */}
          <div
            style={{
              position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 49,
              backgroundColor: 'var(--color-bg-sidebar)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px 16px 0 0',
              padding: '16px 16px 8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>More</span>
              <button onClick={() => setShowMore(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {moreItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all
                    ${isActive ? 'text-white' : 'text-white/50'}`
                  }
                  style={({ isActive }) =>
                    isActive ? { backgroundColor: 'var(--color-bg-sidebar-active)' } : { backgroundColor: 'rgba(255,255,255,0.05)' }
                  }
                >
                  <Icon size={18} />
                  <span style={{ fontSize: 10, textAlign: 'center' }}>{label}</span>
                </NavLink>
              ))}
              <button
                onClick={() => { logout(); navigate('/login'); setShowMore(false) }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
              >
                <LogOut size={18} />
                <span style={{ fontSize: 10 }}>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom nav bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 md:hidden"
        style={{
          backgroundColor: 'var(--color-bg-sidebar)',
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {primaryItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all
              ${isActive ? 'text-white' : 'text-white/40'}`
            }
            style={({ isActive }) =>
              isActive ? { backgroundColor: 'var(--color-bg-sidebar-active)' } : {}
            }
          >
            <Icon size={18} />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setShowMore(!showMore)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 8, border: 'none',
            backgroundColor: showMore ? 'var(--color-bg-sidebar-active)' : 'transparent',
            color: showMore ? 'white' : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}
        >
          <MoreHorizontal size={18} />
          <span style={{ fontSize: 12 }}>More</span>
        </button>
      </div>
    </>
  )
}

export default Sidebar