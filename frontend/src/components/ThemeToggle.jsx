import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

const ThemeToggle = () => {
  const { dark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)'
      }}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className="absolute transition-all duration-300"
        style={{ opacity: dark ? 1 : 0, transform: dark ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(90deg)' }}
      >
        <Sun size={16} />
      </span>
      <span
        className="absolute transition-all duration-300"
        style={{ opacity: dark ? 0 : 1, transform: dark ? 'scale(0.5) rotate(-90deg)' : 'scale(1) rotate(0deg)' }}
      >
        <Moon size={16} />
      </span>
    </button>
  )
}

export default ThemeToggle