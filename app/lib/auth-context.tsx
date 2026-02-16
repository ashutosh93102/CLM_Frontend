'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, tokenManager, User } from './api'
import { ApiClient } from './api-client'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string; company?: string }) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const bootstrap = async () => {
      const token = tokenManager.getAccessToken()
      const cachedUser = tokenManager.getUser()

      setIsAuthenticated(!!token)
      setUser(cachedUser)

      // If we have a token but no cached user (e.g. older login flow), fetch /me once.
      if (token && !cachedUser) {
        try {
          const client = new ApiClient()
          const me = await client.getCurrentUser()
          if (me.success && me.data) {
            const u = (me.data as any) as User
            setUser(u)
            tokenManager.setUser(u)
          }
        } catch {
          // ignore
        }
      }

      setIsLoading(false)
    }

    bootstrap()

    const syncFromStorage = () => {
      const token = tokenManager.getAccessToken()
      const cachedUser = tokenManager.getUser()
      setIsAuthenticated(!!token)
      setUser(cachedUser)
      // Don't touch isLoading here; this is a reactive sync.
    }

    const handleLogout = () => {
      tokenManager.clearTokens()
      setIsAuthenticated(false)
      setUser(null)
      setError(null)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleLogout)
      window.addEventListener('auth:tokens', syncFromStorage)
      window.addEventListener('storage', (e) => {
        if (e.key === 'access_token' && !e.newValue) {
          handleLogout()
        }
      })
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:logout', handleLogout)
        window.removeEventListener('auth:tokens', syncFromStorage)
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      const response = await authAPI.login({ email, password })
      setUser(response.user)
      setIsAuthenticated(true)
    } catch (err: any) {
      const errorMessage = err?.message || err?.detail || 'Login failed'
      setError(errorMessage)
      throw err
    }
  }

  const loginWithGoogle = async (credential: string) => {
    try {
      setError(null)
      const response = await authAPI.googleLogin(credential)
      setUser(response.user)
      setIsAuthenticated(true)
    } catch (err: any) {
      const errorMessage = err?.message || err?.detail || 'Google login failed'
      setError(errorMessage)
      throw err
    }
  }

  const register = async (data: { email: string; password: string; full_name: string; company?: string }) => {
    try {
      setError(null)
      await authAPI.register({
        email: data.email,
        password: data.password,
        first_name: data.full_name,
        company: data.company,
      })
      // Registration now requires OTP verification before login.
      setUser(null)
      setIsAuthenticated(false)
    } catch (err: any) {
      const errorMessage = err?.message || err?.detail || 'Registration failed'
      setError(errorMessage)
      throw err
    }
  }

  const logout = () => {
    tokenManager.clearTokens()
    setIsAuthenticated(false)
    setUser(null)
    setError(null)
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, error, user, login, loginWithGoogle, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
