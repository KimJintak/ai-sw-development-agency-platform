'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '@/lib/use-theme'

const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun size={14} />, label: 'Light' },
  { value: 'system', icon: <Monitor size={14} />, label: 'System' },
  { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
]

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div className={compact ? 'h-8 w-8' : 'h-9 w-32'} />
  }

  if (compact) {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    return (
      <button
        onClick={() => setTheme(next)}
        title={`Switch to ${next} mode`}
        className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
      </button>
    )
  }

  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
            theme === opt.value
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
