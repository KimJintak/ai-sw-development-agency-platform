'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { Inbox, MessageSquare } from 'lucide-react'

interface InboxItem {
  projectId: string
  projectName: string
  unreadCount: number
  latestMessage: null | {
    authorName: string
    body: string
    createdAt: string
    kind: string
  }
  lastReadAt: string
}

export default function MessagesPage() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = () =>
      apiClient
        .get<InboxItem[]>('/api/chat/inbox')
        .then((r) => {
          if (active) setItems(r.data)
        })
        .finally(() => active && setLoading(false))
    void load()
    const id = setInterval(load, 10_000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Inbox size={20} />
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <MessageSquare className="mx-auto mb-3 opacity-50" size={32} />
          <p>속한 프로젝트가 없거나 아직 메시지가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Link
              key={it.projectId}
              href={`/projects/${it.projectId}/chat`}
              className="block border rounded-lg p-4 bg-card hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold truncate">{it.projectName}</h2>
                    {it.unreadCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                        {it.unreadCount}
                      </span>
                    )}
                  </div>
                  {it.latestMessage ? (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      <span className="font-medium">{it.latestMessage.authorName}:</span>{' '}
                      {it.latestMessage.body}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic mt-1">
                      아직 메시지가 없습니다.
                    </p>
                  )}
                </div>
                {it.latestMessage && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(it.latestMessage.createdAt).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
