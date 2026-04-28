import { useEffect, useState } from 'react'
import api from '../api/axios'
import { GitMerge, Check, X, Loader } from 'lucide-react'

const formatNaira = (amount) => {
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`
  return `₦${amount}`
}

const confidenceColor = (score) => {
  if (score >= 70) return 'var(--color-success)'
  if (score >= 50) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

const Reconciliation = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/reconciliation')
      setMatches(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMatches() }, [])

  const runReconciliation = async () => {
    setRunning(true)
    setMessage('')
    try {
      const { data } = await api.post('/reconciliation/run')
      setMessage(data.message)
      fetchMatches()
    } catch (err) {
      setMessage('Failed to run reconciliation.')
    } finally {
      setRunning(false)
    }
  }

  const confirmMatch = async (id) => {
    try {
      await api.put(`/reconciliation/${id}/confirm`)
      fetchMatches()
    } catch (err) {
      console.error(err)
    }
  }

  const rejectMatch = async (id) => {
    try {
      await api.delete(`/reconciliation/${id}`)
      fetchMatches()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Reconciliation
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Match your payments to invoices automatically
          </p>
        </div>
        <button
          onClick={runReconciliation}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {running ? <Loader size={15} className="animate-spin" /> : <GitMerge size={15} />}
          {running ? 'Running...' : 'Run reconciliation'}
        </button>
      </div>

      {message && (
        <div
          className="mb-6 px-4 py-3 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)' }}
          />
        </div>
      ) : matches.length === 0 ? (
        <div
          className="rounded-xl p-16 text-center"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <GitMerge size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No matches yet. Add invoices and payments then run reconciliation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match._id}
              className="rounded-xl p-5"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      Invoice
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {match.invoice?.customerName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {match.invoice?.invoiceNumber} · {formatNaira(match.invoice?.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      Payment
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {match.payment?.customerName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {match.payment?.reference || '—'} · {formatNaira(match.payment?.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: confidenceColor(match.confidenceScore) }}
                    >
                      {match.confidenceScore}%
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      confidence
                    </p>
                  </div>

                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                    style={{
                      color: match.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)',
                      backgroundColor: match.status === 'confirmed' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)'
                    }}
                  >
                    {match.status.replace('_', ' ')}
                  </span>

                  {match.status === 'pending_review' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmMatch(match._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-success-bg)' }}
                      >
                        <Check size={14} style={{ color: 'var(--color-success)' }} />
                      </button>
                      <button
                        onClick={() => rejectMatch(match._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-danger-bg)' }}
                      >
                        <X size={14} style={{ color: 'var(--color-danger)' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reconciliation