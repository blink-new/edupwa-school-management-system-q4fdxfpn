import React, { useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { AuthContext, AuthContextType } from './auth-context'
import blink from '@/blink/client'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | undefined>()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setIsLoading(state.isLoading)
      setIsAuthenticated(state.isAuthenticated)
      setTokens(state.tokens)
    })

    return unsubscribe
  }, [])

  const login = () => {
    blink.auth.login()
  }

  const logout = () => {
    blink.auth.logout()
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    tokens,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}