'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DemoModeProvider, useDemoMode } from '@/lib/demo/demo-context'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { CurrentUserProvider } from '@/lib/auth/current-user-context'
import { Eye, X } from 'lucide-react'

function DemoBanner() {
  const { isDemoMode, toggleDemoMode } = useDemoMode()
  if (!isDemoMode) return null

  return (
    <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm shadow-sm">
      <Eye size={14} className="shrink-0" />
      <span className="font-medium">Demo Mode</span>
      <span className="hidden sm:inline opacity-90">
        — 샘플 데이터를 보고 있습니다. 실제 데이터가 아닙니다.
      </span>
      <button
        onClick={toggleDemoMode}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
        title="Demo Mode 끄기"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <CurrentUserProvider>
        <DemoModeProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <DemoBanner />
              <div className="p-6">{children}</div>
            </main>
          </div>
        </DemoModeProvider>
      </CurrentUserProvider>
    </I18nProvider>
  )
}
