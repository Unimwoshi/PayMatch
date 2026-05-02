import { useState, useEffect } from 'react'
import { Download, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import api from '../api/axios'

const formatNaira = (amount) => {
  return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div style={{
    padding: 20, borderRadius: 12, border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-card)', display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} style={{ color }} />
      </div>
    </div>
    <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</p>
  </div>
)

const TaxSummary = () => {
  const [period, setPeriod] = useState('monthly')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (period === 'custom' && from && to) {
        params.append('from', from)
        params.append('to', to)
      }
      const { data } = await api.get(`/tax/summary?${params}`)
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [period])

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ period })
      if (period === 'custom') { params.append('from', from); params.append('to', to) }
      const res = await api.get(`/tax/export/pdf?${params}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `tax-summary-${period}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ period })
      if (period === 'custom') { params.append('from', from); params.append('to', to) }
      const res = await api.get(`/tax/export/csv?${params}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `tax-summary-${period}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  const inputStyle = {
    padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)',
    fontSize: 12, outline: 'none',
  }

  return (
    <div className="p-4 md:p-8">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Tax Summary</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Financial summary for tax reporting purposes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportCSV} disabled={exporting} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
            backgroundColor: 'transparent', fontSize: 12, color: 'var(--color-text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={handleExportPDF} disabled={exporting} style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            backgroundColor: 'var(--color-primary)', fontSize: 12, color: 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <FileText size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {['monthly', 'quarterly', 'annually', 'custom'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: period === p ? 600 : 400, textTransform: 'capitalize',
            backgroundColor: period === p ? 'var(--color-primary)' : 'var(--color-bg-card)',
            color: period === p ? 'white' : 'var(--color-text-secondary)',
            border: period === p ? 'none' : '1px solid var(--color-border)',
          }}>
            {p}
          </button>
        ))}
        {period === 'custom' && (
          <>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
            <button onClick={fetchStats} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none',
              backgroundColor: 'var(--color-primary)', color: 'white', fontSize: 12, cursor: 'pointer',
            }}>
              Apply
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard label="Total revenue" value={formatNaira(stats.totalRevenue)} icon={TrendingUp} color="var(--color-primary)" />
            <StatCard label="Total received" value={formatNaira(stats.totalReceived)} icon={TrendingUp} color="var(--color-success)" />
            <StatCard label="VAT collected" value={formatNaira(stats.totalVATCollected)} icon={DollarSign} color="var(--color-warning)" />
            <StatCard label="WHT deducted" value={formatNaira(stats.totalWHT)} icon={DollarSign} color="var(--color-warning)" />
            <StatCard label="Total expenses" value={formatNaira(stats.totalExpenses)} icon={TrendingDown} color="var(--color-danger)" />
            <StatCard label="Net profit" value={formatNaira(stats.netProfit)} icon={TrendingUp} color={stats.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            backgroundColor: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning)',
            fontSize: 12, color: 'var(--color-text-secondary)',
          }}>
            ⚠ This report is generated for reference purposes only. Please consult a qualified accountant for official tax filing with FIRS.
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default TaxSummary