import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const init = async () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      try {
        // Always fetch fresh from DB — never trust localStorage for role
        const { data } = await api.get('/auth/me')
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      } catch (err) {
        // Token expired or invalid — clear everything
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }
  init()
}, [])

  const login = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('token', tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout error:', err.message)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  const updateUser = (userData) => {
    const updated = { ...user, ...userData }
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }

  const needsOnboarding = user && !user.onboardingComplete

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      loading,
      updateUser,
      needsOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)