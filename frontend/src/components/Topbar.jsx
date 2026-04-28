import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'

const Topbar = ({ title }) => {
  const { user } = useAuth()

  return (
    <div
      className="flex items-center justify-between px-8 py-4 sticky top-0 z-10"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {title}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {user?.businessName || user?.name}
        </span>
        <ThemeToggle />
      </div>
    </div>
  )
}

export default Topbar