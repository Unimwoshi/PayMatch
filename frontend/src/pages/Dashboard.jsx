import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, Wallet, ArrowUpRight, Bell
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const formatNaira = (amount) => {
  if (!amount && amount !== 0) return '₦0'
  const abs = Math.abs(amount)
  const prefix = amount < 0 ? '-' : ''
  if (abs >= 1000000) return `${prefix}₦${(abs / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${prefix}₦${(abs / 1000).toFixed(0)}K`
  return `${prefix}₦${abs}`
}

const StatCard = ({ label, value, sub, icon: Icon, color, negative }) => (
  <div
    className="rounded-xl p-5 flex flex-col gap-3"
    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
        <Icon size={15} style={{ color }} />
      </div>
    </div>
    <div>
      <p className="text-2xl font-semibold" style={{ color: negative ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>}
    </div>
  </div>
)

const CATEGORY_COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
]

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reconciliation/dashboard')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)' }} />
    </div>
  )

  const pieData = [
    { name: 'Paid', value: stats?.invoiceCounts?.paid || 0 },
    { name: 'Partial', value: stats?.invoiceCounts?.partial || 0 },
    { name: 'Unpaid', value: stats?.invoiceCounts?.unpaid || 0 },
  ]
  const PIE_COLORS = ['var(--color-success)', 'var(--color-warning)', 'var(--color-danger)']

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Here's your financial overview
        </p>
      </div>

      {/* Stat cards — 2x3 on mobile, 3x2 on desktop, all 6 on xl */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total invoiced"
          value={formatNaira(stats?.totalInvoiced || 0)}
          sub={`${stats?.invoiceCounts?.total || 0} invoices`}
          icon={TrendingUp}
          color="var(--color-primary)"
        />
        <StatCard
          label="Total received"
          value={formatNaira(stats?.totalReceived || 0)}
          sub={`${stats?.paymentCounts?.matched || 0} matched`}
          icon={CheckCircle}
          color="var(--color-success)"
        />
        <StatCard
          label="Outstanding"
          value={formatNaira(stats?.totalOutstanding || 0)}
          sub={`${stats?.invoiceCounts?.unpaid || 0} unpaid`}
          icon={TrendingDown}
          color="var(--color-warning)"
        />
        <StatCard
          label="Overdue"
          value={stats?.invoiceCounts?.overdue || 0}
          sub="Past due date"
          icon={AlertCircle}
          color="var(--color-danger)"
        />
        <StatCard
          label="Expenses (month)"
          value={formatNaira(stats?.totalExpensesThisMonth || 0)}
          sub="Confirmed only"
          icon={ArrowUpRight}
          color="var(--color-danger)"
        />
        <StatCard
          label="Net cash (month)"
          value={formatNaira(stats?.netCashPosition || 0)}
          sub="Income minus expenses"
          icon={Wallet}
          color={stats?.netCashPosition >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
          negative={stats?.netCashPosition < 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* 6-month income vs expenses bar chart */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            6-month cash flow
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.sixMonthData || []} barSize={14} barGap={4}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(val, name) => [formatNaira(val), name === 'income' ? 'Income' : 'Expenses']}
                contentStyle={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10, fontSize: 12,
                  color: 'var(--color-text-primary)',
                }}
                cursor={{ fill: 'var(--color-border)', opacity: 0.3 }}
              />
              <Bar dataKey="income" radius={[4, 4, 0, 0]} fill="var(--color-success)" name="Income" />
              <Bar dataKey="expenses" radius={[4, 4, 0, 0]} fill="var(--color-danger)" name="Expenses" />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                formatter={(value) => value === 'income' ? 'Income' : 'Expenses'}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice status donut */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Invoice status breakdown
          </h2>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10, fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.name}</span>
                  <span className="text-sm font-medium ml-auto" style={{ color: 'var(--color-text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expense breakdown donut */}
      {stats?.expenseCategoryData?.length > 0 && (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Expenses this month by category
            </h2>
            <button
              onClick={() => navigate('/receipts')}
              style={{ fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all →
            </button>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={stats.expenseCategoryData} cx="50%" cy="50%"
                  innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {stats.expenseCategoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatNaira(val), '']}
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10, fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {stats.expenseCategoryData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)', flex: 1 }}>{item.name}</span>
                  <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>{formatNaira(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overdue invoices */}
      {stats?.overdueInvoices?.length > 0 && (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} style={{ color: 'var(--color-danger)' }} />
              <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Overdue invoices
              </h2>
            </div>
            <button
              onClick={() => navigate('/reminders')}
              style={{ fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Send reminders →
            </button>
          </div>
          <div className="space-y-3">
            {stats.overdueInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {inv.customerName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {inv.invoiceNumber ? `#${inv.invoiceNumber}` : 'No number'} · {inv.daysOverdue}d overdue
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
                    {formatNaira(inv.remainingBalance)}
                  </span>
                  <button
                    onClick={() => navigate('/reminders')}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: 'none', backgroundColor: 'var(--color-danger-bg)',
                      color: 'var(--color-danger)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Bell size={10} /> Remind
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard