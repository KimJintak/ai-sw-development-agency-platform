'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Bot,
  MessageSquare,
  Settings,
  Building2,
  PlayCircle,
  Inbox,
  ShieldAlert,
  Monitor,
} from 'lucide-react'
import { useDemoMode } from '@/lib/demo/demo-context'
import { useI18n } from '@/lib/i18n/i18n-context'
import type { TranslationKey } from '@/lib/i18n/translations'
import { NotificationBell } from '@/components/notifications/notification-bell'

const nav: { href: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/projects', labelKey: 'nav.projects', icon: FolderKanban },
  { href: '/messages', labelKey: 'nav.messages', icon: Inbox },
  { href: '/crm', labelKey: 'nav.crm', icon: Building2 },
  { href: '/agents', labelKey: 'nav.agents', icon: Bot },
  { href: '/feedback', labelKey: 'nav.feedback', icon: MessageSquare },
  { href: '/admin/ops', labelKey: 'nav.adminOps', icon: ShieldAlert },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
]

function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode()
  const { t } = useI18n()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDemoMode}
      onClick={toggleDemoMode}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
        isDemoMode
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Monitor size={16} />
      <span className="flex-1 text-left">{isDemoMode ? t('demo.on') : t('demo.mode')}</span>
      <span
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
          isDemoMode ? 'bg-amber-500' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
            isDemoMode ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <aside className="w-60 min-h-screen bg-card border-r flex flex-col">
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
          <span className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground text-xs font-extrabold">
            AI
          </span>
          <span className="text-base">Agency</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle compact />
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              {t(labelKey)}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t space-y-1">
        <Link
          href="/demo"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === '/demo' || pathname.startsWith('/demo/')
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <PlayCircle size={16} />
          {t('nav.demoTour')}
        </Link>
        <DemoModeToggle />
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login' }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Users size={16} />
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  )
}
