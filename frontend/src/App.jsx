import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar, { MobileNav } from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import Payments from './pages/Payments'
import Reconciliation from './pages/Reconciliation'


const AppLayout = ({ children, title }) => (
  <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
    <div className="hidden md:flex">
      <Sidebar />
    </div>
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title={title} />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
    <MobileNav />
  </div>
)
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout title="Dashboard">
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute>
              <AppLayout title="Invoices">
                <Invoices />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute>
              <AppLayout title="Payments">
                <Payments />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/reconciliation" element={
            <ProtectedRoute>
              <AppLayout title="Reconciliation">
                <Reconciliation />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App