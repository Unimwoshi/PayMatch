import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  GitMerge,
  LogOut,
  ChevronLeft,
  ChevronRight, 
  Settings,
  User,
  Users
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/reconciliation', label: 'Reconcile', icon: GitMerge },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/customers', label: 'Customers', icon: Users },
]

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
          Fyn<span style={{ color: 'var(--color-primary-bright)' }}>lo</span>
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

      <nav className="flex-1 px-2 space-y-0.5">
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

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 md:hidden"
      style={{
        backgroundColor: 'var(--color-bg-sidebar)',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {navItems.map(({ to, label, icon: Icon }) => (
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

        

      <button
        onClick={() => { logout(); navigate('/login') }}
        className="flex flex-col items-center gap-1 px-3 py-1.5 text-white/40"
      >
        <LogOut size={18} />
        <span className="text-xs">Logout</span>
      </button>
    </div>
  )
}

export default Sidebar