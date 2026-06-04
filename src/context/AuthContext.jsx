import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCurrentUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const login = useCallback(async (email, password) => {
    const u = await api.login(email, password)
    setUser(u)
    return u
  }, [])

  const signup = useCallback(async (email, password, profileData) => {
    const u = await api.signUp(email, password, profileData)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const u = await api.getCurrentUser()
    setUser(u)
    return u
  }, [])

  const updateProfile = useCallback(
    async (updates) => {
      const u = await api.updateProfile(user.id, updates)
      setUser(u)
      return u
    },
    [user],
  )

  const changePassword = useCallback(
    async (currentPassword, newPassword) => api.changePassword(user.id, currentPassword, newPassword),
    [user],
  )

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshUser, updateProfile, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
