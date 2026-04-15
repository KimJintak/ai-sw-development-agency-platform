'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import apiClient from '@/lib/api-client'
import { Send, Bot, User as UserIcon, Settings2, Wifi, WifiOff } from 'lucide-react'

type AuthorType = 'USER' | 'AGENT' | 'SYSTEM'
type MessageKind = 'TEXT' | 'STATUS' | 'COMMAND' | 'AGENT_UPDATE'

interface ChatMessage {
  id: string
  projectId: string
  authorType: AuthorType
  authorId: string
  authorName: string
  kind: MessageKind
  body: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export function ChatRoom({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<ChatMessage[]>(`/api/projects/${projectId}/chat`)
      setMessages(res.data.slice().reverse())
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!token) return

    const base =
      process.env.NEXT_PUBLIC_WS_URL ??
      (typeof window !== 'undefined' ? window.location.origin : '')
    const socket = io(`${base}/chat`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('room:join', { projectId })
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    })

    return () => {
      socket.emit('room:leave', { projectId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (messages.length === 0) return
    void apiClient.post(`/api/projects/${projectId}/chat/read`, {
      lastReadAt: new Date().toISOString(),
    })
  }, [projectId, messages.length])

  const send = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const kind = body.startsWith('/') ? 'COMMAND' : 'TEXT'
      const res = await apiClient.post<ChatMessage>(`/api/projects/${projectId}/chat`, {
        body,
        kind,
      })
      setDraft('')
      setMessages((prev) =>
        prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data],
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-6 py-3 border-b bg-card flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">프로젝트 채팅</h2>
          <p className="text-xs text-muted-foreground">
            멤버·에이전트와 실시간으로 작업 상황을 주고받습니다. `/task` 로 작업을 지시할 수 있습니다.
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
            connected
              ? 'bg-green-500/10 text-green-600'
              : 'bg-muted text-muted-foreground'
          }`}
          title={connected ? '실시간 연결됨' : '연결 끊김 — 재접속 중'}
        >
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'live' : 'offline'}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center">불러오는 중...</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center italic py-12">
            아직 메시지가 없습니다. 첫 메시지를 남겨보세요.
          </div>
        ) : (
          messages.map((m) => <MessageRow key={m.id} m={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t p-4 bg-card">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder="메시지를 입력하세요. 명령어: /task @MAC_DEV code_generation REQ-001"
            rows={2}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send size={14} />
            전송
          </button>
        </div>
      </footer>
    </div>
  )
}

function MessageRow({ m }: { m: ChatMessage }) {
  const isSystem = m.authorType === 'SYSTEM'
  const isAgent = m.authorType === 'AGENT'

  if (isSystem) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
        <Settings2 size={12} />
        <span>{m.body}</span>
        <span className="opacity-60">· {formatTime(m.createdAt)}</span>
      </div>
    )
  }

  const Avatar = isAgent ? Bot : UserIcon
  const tone = isAgent ? 'bg-indigo-500/10 text-indigo-600' : 'bg-primary/10 text-primary'
  const isCommand = m.kind === 'COMMAND'

  return (
    <div className="flex gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
        <Avatar size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{m.authorName}</span>
          {isAgent && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600">
              AGENT
            </span>
          )}
          <span className="text-xs text-muted-foreground">{formatTime(m.createdAt)}</span>
        </div>
        <div
          className={`text-sm mt-0.5 whitespace-pre-wrap ${
            isCommand ? 'font-mono bg-muted/50 px-2 py-1 rounded inline-block' : ''
          }`}
        >
          {m.body}
        </div>
      </div>
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  return sameDay
    ? d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
