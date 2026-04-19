'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DemoModeContextValue {
  isDemoMode: boolean
  toggleDemoMode: () => void
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  toggleDemoMode: () => {},
})

const STORAGE_KEY = 'demo-mode'

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      // Reload to apply — interceptor checks localStorage directly
      setTimeout(() => window.location.reload(), 50)
      return next
    })
  }, [])

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}
