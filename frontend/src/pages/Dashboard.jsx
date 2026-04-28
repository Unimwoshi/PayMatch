import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const formatNaira = (amount) => {
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`
  return `₦${amount}`
}

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div
    className="rounded-xl p-5 flex flex-col gap-3"
    style={{
      backgroundColor: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)'
    }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color + '18' }}
      >
        <Icon size={15} style={{ color }} />
      </div>
    </div>
    <div>
      <p className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {sub}
        </p>
      )}
    </div>
  </div>
)

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/reconciliation/dashboard')
        setStats(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-primary)' }}
        />
      </div>
    )
  }

  const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

  const pieData = [
    { name: 'Paid', value: stats?.invoiceCounts?.paid || 0 },
    { name: 'Partial', value: stats?.invoiceCounts?.partial || 0 },
    { name: 'Unpaid', value: stats?.invoiceCounts?.unpaid || 0 },
  ]

  const barData = [
    { name: 'Invoiced', amount: stats?.totalInvoiced || 0 },
    { name: 'Received', amount: stats?.totalReceived || 0 },
    { name: 'Outstanding', amount: stats?.totalOutstanding || 0 },
  ]

  const PIE_COLORS = ['var(--color-success)', 'var(--color-warning)', 'var(--color-danger)']

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Here's your financial overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          sub={`${stats?.invoiceCounts?.unpaid || 0} unpaid invoices`}
          icon={TrendingDown}
          color="var(--color-warning)"
        />
        <StatCard
          label="Overdue"
          value={stats?.invoiceCounts?.overdue || 0}
          sub="Invoices past due date"
          icon={AlertCircle}
          color="var(--color-danger)"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <h2 className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Financial overview
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={36}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(val) => formatNaira(val)}
                contentStyle={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <h2 className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Invoice status breakdown
          </h2>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.name}
                  </span>
                  <span className="text-sm font-medium ml-auto" style={{ color: 'var(--color-text-primary)' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {stats?.overdueInvoices?.length > 0 && (
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} style={{ color: 'var(--color-danger)' }} />
            <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Overdue invoices
            </h2>
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
                    {inv.invoiceNumber} · {inv.daysOverdue}d overdue
                  </p>
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {formatNaira(inv.remainingBalance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard