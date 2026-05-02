import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { NotificationProvider } from './context/NotificationContext'
import Onboarding from './pages/Onboarding'
import InstallPrompt from './components/InstallPrompt'
import Customers from './pages/Customers'
import InvoicePreview from './pages/InvoicePreview'
import Receipts from './pages/Receipts'
import Reminders from './pages/Reminders'



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

const OnboardingGuard = ({ children }) => {
  const { user } = useAuth()
  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}
function App() {
  return (
    <ThemeProvider>
      <AuthProvider> 
        <NotificationProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <OnboardingGuard>
              <AppLayout title="Dashboard">
                <Dashboard />
              </AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
          } />
          <Route path="/invoices/:id/preview" element={
             <ProtectedRoute>
              <OnboardingGuard>
                <AppLayout title="Invoice Preview">
                  <InvoicePreview />
                </AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
            } />
          <Route path="/invoices" element={
            <ProtectedRoute>
              <OnboardingGuard>
              <AppLayout title="Invoices">
                <Invoices />
              </AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute>
              <OnboardingGuard>
              <AppLayout title="Payments">
                <Payments />
              </AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
          } />
          <Route path="/reconciliation" element={
            <ProtectedRoute>
              <OnboardingGuard>
              <AppLayout title="Reconciliation">
                <Reconciliation />
              </AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <OnboardingGuard>
                <AppLayout title="Profile"><Profile /></AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
            } />
            <Route path="/settings" element={
            <ProtectedRoute>
              <OnboardingGuard>
                <AppLayout title="Settings"><Settings /></AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <AppLayout title="Customers"><Customers /></AppLayout>
                </OnboardingGuard>
              </ProtectedRoute>
            } />
            <Route path="/receipts" element={
            <ProtectedRoute>
              <OnboardingGuard>
                <AppLayout title="Receipts"><Receipts /></AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
            } />
            <Route path="/reminders" element={
            <ProtectedRoute>
              <OnboardingGuard>
                <AppLayout title="Reminders"><Reminders /></AppLayout>
              </OnboardingGuard>
            </ProtectedRoute>
            } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <InstallPrompt/>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App