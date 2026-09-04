import React, { createContext, useContext, useEffect, useState } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('stms_user')
    const token = localStorage.getItem('stms_token')
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const persistSession = (loggedInUser, token) => {
    // api.js's request interceptor reads the token from localStorage,
    // so it must always be written there regardless of "remember me" —
    // sessionStorage alone would mean every API call fails auth after
    // the very first page load.
    localStorage.setItem('stms_user', JSON.stringify(loggedInUser))
    localStorage.setItem('stms_token', token)
  }

  const login = async ({ role, id, password, rememberMe }) => {
    const { user: loggedInUser, token } = await authService.login({
      role,
      id,
      password,
    })
    setUser(loggedInUser)
    persistSession(loggedInUser, token)
    return loggedInUser
  }

  // This was missing entirely before, so Register.jsx's
  // `const { register } = useAuth()` was always undefined.
  const register = async ({ name, email, password, role, phone }) => {
    const { user: registeredUser, token } = await authService.register({
      name,
      email,
      password,
      role,
      phone,
    })
    setUser(registeredUser)
    persistSession(registeredUser, token)
    return registeredUser
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    localStorage.removeItem('stms_user')
    localStorage.removeItem('stms_token')
  }

  // NEW: merges updated fields into the current user, in both state and
  // localStorage, without touching the auth token. TrainerProfile.jsx
  // (and any other profile-edit screen) calls this after a successful
  // update API call so the UI reflects the change immediately.
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields }
      localStorage.setItem('stms_user', JSON.stringify(merged))
      return merged
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}