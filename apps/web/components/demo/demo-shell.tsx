'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/sidebar'
import { DemoModeProvider } from '@/lib/demo/demo-context'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { CurrentUserProvider } from '@/lib/auth/current-user-context'
import { PlayCircle, LogIn } from 'lucide-react'

export function DemoShell({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setAuthed(typeof window !== 'undefined' && !!localStorage.getItem('accessToken'))
  }, [])

  if (authed === null) {
    return <div className="min-h-screen bg-background" />
  }

  if (authed) {
    return (
      <I18nProvider>
        <CurrentUserProvider>
          <DemoModeProvider>
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <div className="p-6">{children}</div>
              </main>
            </div>
          </DemoModeProvider>
        </CurrentUserProvider>
      </I18nProvider>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b bg-card flex items-center justify-between px-6">
        <Link href="/demo" className="flex items-center gap-2 font-bold">
          <PlayCircle size={18} className="text-primary" />
          Agency Platform
          <span className="text-xs font-normal px-2 py-0.5 rounded bg-primary/10 text-primary ml-1">
            DEMO
          </span>
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border hover:bg-muted"
        >
          <LogIn size={14} />
          로그인
        </Link>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
      <footer className="border-t py-3 text-center text-xs text-muted-foreground">
        이 화면은 시뮬레이션이며 실제 시스템에 영향을 주지 않습니다.
      </footer>
    </div>
  )
}
