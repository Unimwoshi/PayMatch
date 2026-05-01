import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

const InstallPrompt = () => {
  const [prompt, setPrompt] = useState(null)
  const [showIOS, setShowIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const wasDismissed = localStorage.getItem('installDismissed')

    if (wasDismissed || isStandalone) return

    if (isIOS) {
      setShowIOS(true)
      return
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setPrompt(e)
    })
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    await prompt.prompt()
    setPrompt(null)
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('installDismissed', 'true')
  }

  if (dismissed || (!prompt && !showIOS)) return null

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40 rounded-xl p-4 shadow-lg"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)'
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--color-primary-muted)' }}
        >
          <Download size={16} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Install Aether
          </p>
          {showIOS ? (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Tap the Share icon then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Add to your home screen for the best experience
            </p>
          )}
          {!showIOS && (
            <button
              onClick={handleInstall}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Install app
            </button>
          )}
        </div>
        <button onClick={handleDismiss}>
          <X size={15} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt