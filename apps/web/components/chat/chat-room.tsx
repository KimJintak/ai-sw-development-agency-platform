'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import apiClient from '@/lib/api-client'
import { Send, Bot, User as UserIcon, Settings2, Wifi, WifiOff, HelpCircle, X } from 'lucide-react'
import { useDemoMode } from '@/lib/demo/demo-context'

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
  const [qnaTarget, setQnaTarget] = useState<ChatMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const { isDemoMode } = useDemoMode()

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

  // In demo mode, skip WebSocket and just show connected
  useEffect(() => {
    if (isDemoMode) {
      setConnected(true)
      return
    }
  }, [isDemoMode])

  useEffect(() => {
    if (isDemoMode) return

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
  }, [projectId, isDemoMode])

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
          messages.map((m) => <MessageRow key={m.id} m={m} onCapture={() => setQnaTarget(m)} />)
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

      {qnaTarget && (
        <CaptureToQnaModal
          projectId={projectId}
          message={qnaTarget}
          onClose={() => setQnaTarget(null)}
        />
      )}
    </div>
  )
}

function MessageRow({ m, onCapture }: { m: ChatMessage; onCapture: () => void }) {
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
    <div className="group flex gap-3">
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
          <button
            onClick={onCapture}
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
            title="이 메시지를 Q&A 질문으로 담기"
          >
            <HelpCircle size={10} />
            Q&A로 담기
          </button>
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

function CaptureToQnaModal({
  projectId,
  message,
  onClose,
}: {
  projectId: string
  message: ChatMessage
  onClose: () => void
}) {
  const [question, setQuestion] = useState(message.body)
  const [priority, setPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async () => {
    if (!question.trim() || submitting) return
    setSubmitting(true)
    try {
      await apiClient.post(`/api/projects/${projectId}/qna`, {
        question: question.trim(),
        priority,
        tags: ['from-chat'],
      })
      onClose()
      alert('Q&A에 저장되었습니다.')
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-rose-600" />
            <span className="font-semibold text-sm">Q&A로 담기</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </header>
        <div className="p-4 space-y-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">원본:</span> {message.authorName} · {formatTime(message.createdAt)}
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            autoFocus
            className="w-full px-3 py-2 text-sm border rounded bg-background resize-none"
            placeholder="질문 내용"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground">우선순위:</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'P0' | 'P1' | 'P2' | 'P3')}
              className="px-2 py-1 text-xs border rounded bg-background"
            >
              {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="ml-auto text-[10px] text-muted-foreground">
              태그: <code className="px-1 bg-muted rounded">from-chat</code>
            </span>
          </div>
        </div>
        <footer className="px-4 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!question.trim() || submitting}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            {submitting ? '저장 중...' : 'Q&A에 저장'}
          </button>
        </footer>
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
