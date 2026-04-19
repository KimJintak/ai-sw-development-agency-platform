'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import apiClient from '@/lib/api-client'

export type UserRole = 'ADMIN' | 'PM' | 'CLIENT' | 'AGENT'

export interface CurrentUser {
  id: string
  email: string
  name?: string | null
  role: UserRole
}

interface Ctx {
  user: CurrentUser | null
  loading: boolean
  refresh: () => Promise<void>
}

const CurrentUserContext = createContext<Ctx>({
  user: null,
  loading: true,
  refresh: async () => {},
})

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const { data } = await apiClient.get<CurrentUser>('/api/auth/me')
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <CurrentUserContext.Provider value={{ user, loading, refresh }}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  return useContext(CurrentUserContext)
}

export function hasRole(user: CurrentUser | null, ...allowed: UserRole[]): boolean {
  return !!user && allowed.includes(user.role)
}
