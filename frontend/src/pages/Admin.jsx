// pages/Admin.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import {
  Users, AlertTriangle, FileText, TrendingUp,
  Search, Shield, ChevronRight, X, Check,
  Ban, RefreshCw, Activity, Eye
} from 'lucide-react'

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const tierColors = {
  clean: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  yellow: { color: '#D97706', bg: '#FEF3C7' },
  orange: { color: '#EA580C', bg: '#FFF7ED' },
  red: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
}

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div style={{ padding: 20, borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  </div>
)

const Admin = () => {
  const [tab, setTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [flags, setFlags] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [showSuspendModal, setShowSuspendModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'overview') {
        const { data } = await api.get('/admin/overview')
        setOverview(data)
      }
      if (tab === 'users') {
        const { data } = await api.get('/admin/users')
        setUsers(data.users)
      }
      if (tab === 'flags') {
        const { data } = await api.get('/admin/flags')
        setFlags(data)
      }
      if (tab === 'audit') {
        const { data } = await api.get('/admin/audit')
        setAuditLogs(data.logs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadUserDetail = async (userId) => {
    try {
      const { data } = await api.get(`/admin/users/${userId}`)
      setUserDetail(data)
      setSelectedUser(userId)
    } catch (err) { console.error(err) }
  }

  const handleSuspend = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await api.post(`/admin/users/${selectedUser}/suspend`, { reason: suspendReason })
      setShowSuspendModal(false)
      setSuspendReason('')
      loadUserDetail(selectedUser)
      loadData()
    } catch (err) { console.error(err) }
    finally { setActionLoading(false) }
  }

  const handleRestore = async (userId) => {
    setActionLoading(true)
    try {
      await api.post(`/admin/users/${userId}/restore`)
      loadUserDetail(userId)
      loadData()
    } catch (err) { console.error(err) }
    finally { setActionLoading(false) }
  }

  const handleChangePlan = async (userId, plan) => {
    try {
      await api.post(`/admin/users/${userId}/plan`, { plan })
      loadUserDetail(userId)
    } catch (err) { console.error(err) }
  }

  const handleResolveFlag = async (userId) => {
    try {
      await api.post(`/admin/flags/${userId}/resolve`, { note: 'Reviewed and cleared by admin' })
      loadData()
    } catch (err) { console.error(err) }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.businessName?.toLowerCase().includes(search.toLowerCase())
    const matchPlan = !filterPlan || u.plan === filterPlan
    const matchRisk = !filterRisk || u.riskTier === filterRisk
    const matchStatus = !filterStatus ||
      (filterStatus === 'suspended' ? u.suspended : !u.suspended)
    return matchSearch && matchPlan && matchRisk && matchStatus
  })

  const tabs = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'flags', label: 'Risk flags', icon: AlertTriangle },
    { key: 'audit', label: 'Audit log', icon: Activity },
  ]

  const inputStyle = {
    padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)',
    fontSize: 12, outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Admin header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Shield size={20} color="var(--color-primary)" />
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Aether Admin</h1>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontWeight: 700 }}>INTERNAL</span>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
        {/* Sidebar */}
        <div style={{ width: 200, borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', padding: '16px 12px', flexShrink: 0 }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              marginBottom: 4, textAlign: 'left', fontSize: 13,
              backgroundColor: tab === key ? 'rgba(37,99,235,0.08)' : 'transparent',
              color: tab === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: tab === key ? 600 : 400,
            }}>
              <Icon size={15} />
              {label}
              {key === 'flags' && flags.length > 0 && (
                <span style={{ marginLeft: 'auto', padding: '1px 6px', borderRadius: 10, backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 10, fontWeight: 700 }}>
                  {flags.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* Overview tab */}
              {tab === 'overview' && overview && (
                <div>
                  <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Platform overview</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
                    <StatCard label="Total users" value={overview.totalUsers} icon={Users} color="var(--color-primary)" />
                    <StatCard label="New this month" value={overview.newThisMonth} icon={TrendingUp} color="var(--color-success)" />
                    <StatCard label="New this week" value={overview.newThisWeek} icon={TrendingUp} color="var(--color-success)" />
                    <StatCard label="Total invoices" value={overview.totalInvoices} icon={FileText} color="var(--color-primary)" />
                    <StatCard label="Total payments" value={overview.totalPayments} icon={TrendingUp} color="var(--color-success)" />
                    <StatCard label="Flagged accounts" value={overview.flaggedAccounts} icon={AlertTriangle} color="var(--color-warning)" />
                    <StatCard label="Suspended" value={overview.suspendedCount} icon={Ban} color="var(--color-danger)" />
                    <StatCard label="Revenue processed" value={formatNaira(overview.totalRevenue)} icon={TrendingUp} color="var(--color-success)" />
                  </div>

                  {/* Signups chart */}
                  {overview.signupsByDay?.length > 0 && (
                    <div style={{ padding: 20, borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Signups — last 30 days</h3>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                        {overview.signupsByDay.map((day, i) => {
                          const max = Math.max(...overview.signupsByDay.map(d => d.count))
                          const height = max > 0 ? (day.count / max) * 80 : 4
                          return (
                            <div key={i} title={`${day._id}: ${day.count} signups`} style={{
                              flex: 1, height, backgroundColor: 'var(--color-primary)',
                              borderRadius: '2px 2px 0 0', opacity: 0.8, minHeight: 4, cursor: 'default',
                            }} />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Users tab */}
              {tab === 'users' && (
                <div style={{ display: 'flex', gap: 20 }}>
                  {/* User list */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', flex: 1, minWidth: 200 }}>
                        <Search size={13} color="var(--color-text-muted)" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." style={{ border: 'none', outline: 'none', fontSize: 13, backgroundColor: 'transparent', color: 'var(--color-text-primary)', width: '100%' }} />
                      </div>
                      <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={inputStyle}>
                        <option value="">All plans</option>
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="business">Business</option>
                        <option value="pro">Pro</option>
                      </select>
                      <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={inputStyle}>
                        <option value="">All risk levels</option>
                        <option value="clean">Clean</option>
                        <option value="yellow">Yellow</option>
                        <option value="orange">Orange</option>
                        <option value="red">Red</option>
                      </select>
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                            {['User', 'Plan', 'Risk', 'Status', 'Joined', ''].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u, i) => {
                            const tc = tierColors[u.riskTier] || tierColors.clean
                            return (
                              <tr key={u._id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                                onClick={() => loadUserDetail(u._id)}>
                                <td style={{ padding: '12px 14px' }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{u.name}</p>
                                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{u.email}</p>
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{u.plan || 'free'}</td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: tc.bg, color: tc.color, textTransform: 'capitalize' }}>
                                    {u.riskTier}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  {u.suspended
                                    ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-danger)' }}>Suspended</span>
                                    : <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)' }}>Active</span>
                                  }
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--color-text-muted)' }}>
                                  {new Date(u.createdAt).toLocaleDateString('en-NG')}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <ChevronRight size={14} color="var(--color-text-muted)" />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                      {filteredUsers.length} of {users.length} users
                    </p>
                  </div>

                  {/* User detail panel */}
                  {userDetail && (
                    <div style={{ width: 360, flexShrink: 0, borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', overflow: 'hidden', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>User details</h3>
                        <button onClick={() => { setSelectedUser(null); setUserDetail(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                          <X size={16} />
                        </button>
                      </div>

                      <div style={{ padding: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                        {/* Basic info */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                            <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{userDetail.user.name?.charAt(0)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{userDetail.user.name}</p>
                          <p style={{ margin: '2px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{userDetail.user.email}</p>
                          <p style={{ margin: '2px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{userDetail.user.businessName || '—'}</p>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                          {[
                            { label: 'Total invoiced', value: formatNaira(userDetail.stats.totalInvoiced) },
                            { label: 'Total paid', value: formatNaira(userDetail.stats.totalPaid) },
                            { label: 'Customers', value: userDetail.stats.customerCount },
                            { label: 'Expenses', value: userDetail.stats.expenseCount },
                          ].map(s => (
                            <div key={s.label} style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: 'var(--color-bg)', textAlign: 'center' }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.value}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-text-muted)' }}>{s.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Risk info */}
                        {userDetail.riskFlag && (
                          <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, backgroundColor: tierColors[userDetail.riskFlag.tier]?.bg || 'var(--color-bg)', border: `1px solid ${tierColors[userDetail.riskFlag.tier]?.color || 'var(--color-border)'}` }}>
                            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: tierColors[userDetail.riskFlag.tier]?.color }}>
                              Risk score: {userDetail.riskFlag.score}/100 — {userDetail.riskFlag.tier.toUpperCase()}
                            </p>
                            {userDetail.riskFlag.signals?.slice(0, 3).map((s, i) => (
                              <p key={i} style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>• {s.description}</p>
                            ))}
                          </div>
                        )}

                        {/* Verification */}
                        <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, backgroundColor: 'var(--color-bg)' }}>
                          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Verification</p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: userDetail.user.ninVerified ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: userDetail.user.ninVerified ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              NIN {userDetail.user.ninVerified ? '✓' : '✗'}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: userDetail.user.cacVerified ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: userDetail.user.cacVerified ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              CAC {userDetail.user.cacVerified ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {userDetail.user.suspended ? (
                            <button onClick={() => handleRestore(userDetail.user._id)} disabled={actionLoading} style={{ padding: '9px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-success)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <Check size={14} /> Restore access
                            </button>
                          ) : (
                            <button onClick={() => setShowSuspendModal(true)} style={{ padding: '9px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <Ban size={14} /> Suspend account
                            </button>
                          )}

                          <div>
                            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Change plan</p>
                            <select onChange={e => handleChangePlan(userDetail.user._id, e.target.value)} defaultValue={userDetail.user.plan || 'free'} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }}>
                              <option value="free">Free</option>
                              <option value="starter">Starter</option>
                              <option value="business">Business</option>
                              <option value="pro">Pro</option>
                            </select>
                          </div>

                          {userDetail.riskFlag && userDetail.riskFlag.status === 'active' && (
                            <button onClick={() => handleResolveFlag(userDetail.user._id)} style={{ padding: '9px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                              Clear risk flag
                            </button>
                          )}
                        </div>

                        {/* Recent audit logs */}
                        {userDetail.auditLogs?.length > 0 && (
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Recent activity</p>
                            {userDetail.auditLogs.slice(0, 10).map((log, i) => (
                              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{log.action}</span>
                                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: 8 }}>{formatDate(log.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Risk flags tab */}
              {tab === 'flags' && (
                <div>
                  <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Risk flags — {flags.length} active
                  </h2>
                  {flags.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
                      <Shield size={32} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
                      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>No active risk flags. All clear.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {flags.map(flag => {
                        const tc = tierColors[flag.tier] || tierColors.clean
                        return (
                          <div key={flag._id} style={{ padding: 20, borderRadius: 12, border: `1.5px solid ${tc.color}`, backgroundColor: 'var(--color-bg-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{flag.user?.name}</p>
                                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, backgroundColor: tc.bg, color: tc.color, textTransform: 'uppercase' }}>
                                    {flag.tier}
                                  </span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: tc.color }}>{flag.score}/100</span>
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>{flag.user?.email} · {flag.user?.plan || 'free'} plan</p>
                              </div>
                              <button onClick={() => handleResolveFlag(flag.user?._id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                Resolve
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {flag.signals?.filter(s => !s.resolved).map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--color-bg)' }}>
                                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, fontWeight: 700, backgroundColor: tc.bg, color: tc.color, flexShrink: 0, marginTop: 1 }}>{s.severity}</span>
                                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.description}</span>
                                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: 'auto' }}>{formatDate(s.detectedAt)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Audit log tab */}
              {tab === 'audit' && (
                <div>
                  <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Audit log</h2>
                  <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                          {['Time', 'User', 'Action', 'Entity', 'IP'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log, i) => (
                          <tr key={log._id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--color-text-primary)' }}>
                              <p style={{ margin: 0 }}>{log.user?.name || '—'}</p>
                              <p style={{ margin: '1px 0 0', fontSize: 10, color: 'var(--color-text-muted)' }}>{log.user?.email}</p>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: log.adminAction ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{log.entity || '—'}</td>
                            <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{log.ipAddress || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Suspend modal */}
      {showSuspendModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div style={{ width: 400, borderRadius: 16, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', padding: 24 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Suspend account</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              The user will lose access to invoice creation, payment links, and exports. They can still log in and view their data.
            </p>
            <textarea
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension (internal only)..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSuspendModal(false)} style={{ flex: 1, padding: 9, borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'transparent', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                Cancel
              </button>
              <button onClick={handleSuspend} disabled={actionLoading} style={{ flex: 1, padding: 9, borderRadius: 8, border: 'none', backgroundColor: 'var(--color-danger)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {actionLoading ? 'Suspending...' : 'Confirm suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default Admin