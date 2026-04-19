'use client'

import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

function resolve(theme: Theme): ResolvedTheme {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolve(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  return resolved
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light')
  const [resolved, setResolved] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
    setThemeState(stored)
    setResolved(applyTheme(stored))

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
      if (current === 'system') setResolved(applyTheme('system'))
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    setResolved(applyTheme(next))
  }, [])

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setTheme])

  return { theme, resolved, setTheme, toggle }
}
