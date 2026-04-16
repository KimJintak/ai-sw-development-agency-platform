'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, FolderKanban, LogOut } from 'lucide-react'

const nav = [
  { href: '/portal', label: '내 프로젝트', icon: FolderKanban },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="flex items-center gap-2 font-bold">
            <Building2 size={18} className="text-primary" />
            고객 포털
          </Link>
          <nav className="flex gap-1 ml-4">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                    active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/portal/login' }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut size={14} />
          로그아웃
        </button>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  )
}
