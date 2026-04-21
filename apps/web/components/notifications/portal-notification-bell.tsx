'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, FileText, MessageSquare, X } from 'lucide-react'
import apiClient from '@/lib/api-client'
import Link from 'next/link'

interface PortalNotification {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

const typeIcon: Record<string, React.ReactNode> = {
  REQUIREMENT_PENDING: <FileText size={14} className="text-amber-500" />,
  QNA_ANSWERED: <MessageSquare size={14} className="text-green-500" />,
  GENERAL: <Bell size={14} className="text-muted-foreground" />,
}

export function PortalNotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<PortalNotification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        apiClient.get<PortalNotification[]>('/api/portal/notifications'),
        apiClient.get<{ count: number }>('/api/portal/notifications/unread-count'),
      ])
      setItems(listRes.data)
      setUnread(countRes.data.count)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markRead = async (id: string) => {
    await apiClient.patch(`/api/portal/notifications/${id}/read`).catch(() => null)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((c) => Math.max(0, c - 1))
  }

  const markAllRead = async () => {
    await apiClient.patch('/api/portal/notifications/read-all').catch(() => null)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load() }}
        className="relative p-1.5 rounded-md hover:bg-muted transition-colors"
        aria-label="알림"
      >
        <Bell size={16} className="text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm font-semibold">알림</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck size={12} /> 모두 읽음
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">알림이 없습니다.</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 cursor-pointer ${n.read ? '' : 'bg-primary/5'}`}
                  onClick={() => { if (!n.read) markRead(n.id) }}
                >
                  <span className="mt-0.5 shrink-0">{typeIcon[n.type] ?? typeIcon.GENERAL}</span>
                  <div className="flex-1 min-w-0">
                    {n.link ? (
                      <Link href={n.link} className="text-xs font-medium hover:underline line-clamp-1" onClick={() => setOpen(false)}>
                        {n.title}
                      </Link>
                    ) : (
                      <p className="text-xs font-medium line-clamp-1">{n.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
