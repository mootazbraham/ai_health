/**
 * Authentication Hook
 * Manages user authentication state and API calls
 */

import { useState, useEffect, useCallback } from 'react'

interface User {
  id: number
  email: string
  name: string | null
  photoUrl?: string | null
  age?: number | null
  heightCm?: number | null
  weightKg?: number | null
  gender?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  // Load auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('auth_user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setAuthState({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            photoUrl: user.photoUrl,
            age: user.age,
            heightCm: user.heightCm,
            weightKg: user.weightKg,
            gender: user.gender
          },
          token,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        })
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setAuthState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false }))
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      const { token, user } = data

      // Store in localStorage
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))

      setAuthState({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      })

      return { success: true, user, token }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      const { token, user } = data

      // Store in localStorage
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))

      setAuthState({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      })

      return { success: true, user, token }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    })
  }, [])

  const refreshUser = useCallback(async () => {
    const token = authState.token || localStorage.getItem('auth_token')
    if (!token) return
    
    try {
      const response = await fetch('/api/v1/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success && data.user) {
        const updatedUser = data.user
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
        setAuthState(prev => ({ ...prev, user: updatedUser }))
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [authState.token])

  const getAuthHeaders = useCallback(() => {
    const token = authState.token || localStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [authState.token])

  return {
    ...authState,
    login,
    register,
    logout,
    getAuthHeaders,
    refreshUser,
  }
}




