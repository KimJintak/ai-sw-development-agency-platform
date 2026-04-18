'use client'

import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  root.classList.toggle('dark', resolved === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
    setThemeState(stored)
    applyTheme(stored)

    if (stored === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => applyTheme('system')
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }, [])

  const toggle = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }, [setTheme])

  return { theme, setTheme, toggle }
}
