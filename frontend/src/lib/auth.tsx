'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { BACKEND_URL } from './config'

export interface UserProfile {
  id: number
  name: string
  email: string
  role: string
  created_at?: number
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string, confirmPassword?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('aegis_token')
      const savedUserStr = localStorage.getItem('aegis_user_profile')
      
      if (savedToken && savedUserStr) {
        setToken(savedToken)
        setUser(JSON.parse(savedUserStr))
      } else {
        // Fallback check for legacy demo session
        const legacyAuth = localStorage.getItem('aegis_auth')
        const legacyUser = localStorage.getItem('aegis_user')
        if (legacyAuth === 'true' && legacyUser) {
          const demoUser: UserProfile = {
            id: 1,
            name: 'Compliance Analyst',
            email: legacyUser,
            role: 'Compliance Analyst'
          }
          setUser(demoUser)
          setToken('demo-session-token')
        }
      }
    } catch (e) {
      console.error('Error loading stored auth:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember_me: rememberMe })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Authentication failed.' }))
        setIsLoading(false)
        return { success: false, error: errData.detail || 'Invalid email or password.' }
      }

      const data = await res.json()
      setToken(data.access_token)
      setUser(data.user)

      localStorage.setItem('aegis_auth', 'true')
      localStorage.setItem('aegis_token', data.access_token)
      localStorage.setItem('aegis_user_profile', JSON.stringify(data.user))
      localStorage.setItem('aegis_user', data.user.email)
      localStorage.setItem('aegis_role', data.user.role)

      setIsLoading(false)
      return { success: true }
    } catch (e) {
      setIsLoading(false)
      return { success: false, error: 'Cannot connect to backend server. Make sure FastAPI is running.' }
    }
  }

  const signup = async (name: string, email: string, password: string, confirmPassword?: string) => {
    if (confirmPassword && password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' }
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' }
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirm_password: confirmPassword })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Signup failed.' }))
        setIsLoading(false)
        return { success: false, error: errData.detail || 'Signup failed.' }
      }

      const data = await res.json()
      setToken(data.access_token)
      setUser(data.user)

      localStorage.setItem('aegis_auth', 'true')
      localStorage.setItem('aegis_token', data.access_token)
      localStorage.setItem('aegis_user_profile', JSON.stringify(data.user))
      localStorage.setItem('aegis_user', data.user.email)
      localStorage.setItem('aegis_role', data.user.role)

      setIsLoading(false)
      return { success: true }
    } catch (e) {
      setIsLoading(false)
      return { success: false, error: 'Cannot connect to server. Please try again.' }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('aegis_auth')
    localStorage.removeItem('aegis_token')
    localStorage.removeItem('aegis_user_profile')
    localStorage.removeItem('aegis_user')
    localStorage.removeItem('aegis_role')
    router.push('/login')
  }

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    let targetUrl = url
    if (url.startsWith('/')) {
      targetUrl = `${BACKEND_URL}${url}`
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = `${BACKEND_URL}/${url}`
    } else if (url.startsWith('http://127.0.0.1:8000')) {
      targetUrl = url.replace('http://127.0.0.1:8000', BACKEND_URL)
    } else if (url.startsWith('http://localhost:8000')) {
      targetUrl = url.replace('http://localhost:8000', BACKEND_URL)
    }

    const headers = new Headers(options.headers || {})
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return fetch(targetUrl, { ...options, headers })
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
