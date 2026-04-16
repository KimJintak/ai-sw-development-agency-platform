'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import {
  Activity,
  AlertTriangle,
  Eye,
  FolderKanban,
  MessageSquare,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'

type Kind = 'TEXT' | 'STATUS' | 'COMMAND' | 'AGENT_UPDATE' | ''

interface WatchMatch {
  keyword: string
  color: string
}

interface FeedItem {
  id: string
  projectId: string
  project: { id: string; name: string }
  authorType: 'USER' | 'AGENT' | 'SYSTEM'
  authorName: string
  kind: Exclude<Kind, ''>
  body: string
  createdAt: string
  watchMatches?: WatchMatch[]
}

interface WatchKeyword {
  id: string
  keyword: string
  color: string
  active: boolean
  createdAt: string
}

interface Stalled {
  id: string
  taskType: string
  status: string
  createdAt: string
  agentCard: { agentType: string; name: string }
  project: { id: string; name: string } | null
  lastActivityAt: string
  lastUpdateBody: string | null
  idleMinutes: number
  progress: number | null
}

interface Summary {
  projectCount: number
  messageCount24h: number
  activeTaskCount: number
}

export default function AdminOpsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [stalled, setStalled] = useState<Stalled[]>([])
  const [watchKeywords, setWatchKeywords] = useState<WatchKeyword[]>([])
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<Kind>('')
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, f, st, wk] = await Promise.all([
        apiClient.get<Summary>('/api/admin/ops/summary'),
        apiClient.get<FeedItem[]>('/api/admin/ops/feed', {
          params: { q: q || undefined, kind: kind || undefined, limit: 100 },
        }),
        apiClient.get<Stalled[]>('/api/admin/ops/stalled', { params: { minutes: 15 } }),
        apiClient.get<WatchKeyword[]>('/api/admin/watchlist'),
      ])
      setSummary(s.data)
      setFeed(f.data)
      setStalled(st.data)
      setWatchKeywords(wk.data)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 403) setForbidden(true)
    } finally {
      setLoading(false)
    }
  }, [q, kind])

  useEffect(() => {
    void load()
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [load])

  if (forbidden) {
    return (
      <div className="max-w-xl">
        <div className="flex items-start gap-3 p-6 rounded-lg border border-red-200 bg-red-50 text-red-800">
          <ShieldAlert size={20} />
          <div>
            <h2 className="font-semibold">접근 권한이 없습니다</h2>
            <p className="text-sm mt-1">이 페이지는 ADMIN 역할 사용자만 접근할 수 있습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={20} />
          <h1 className="text-2xl font-bold">Agency Ops</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          조직 전체 프로젝트의 채팅·에이전트 활동을 통합 모니터링합니다. 모든 조회는 감사
          로그로 기록됩니다.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          icon={<FolderKanban size={16} />}
          label="활성 프로젝트"
          value={summary?.projectCount}
        />
        <SummaryCard
          icon={<MessageSquare size={16} />}
          label="24시간 메시지"
          value={summary?.messageCount24h}
        />
        <SummaryCard
          icon={<Activity size={16} />}
          label="활성 태스크"
          value={summary?.activeTaskCount}
        />
      </div>

      {stalled.length > 0 && (
        <section className="border border-amber-300 bg-amber-50 rounded-lg p-4">
          <h2 className="flex items-center gap-2 font-semibold text-amber-900 mb-3">
            <AlertTriangle size={16} />
            지연 레이더 · 마지막 활동 후 15분+ 무응답 ({stalled.length}건)
          </h2>
          <div className="space-y-3">
            {stalled.map((t) => {
              const severity =
                t.idleMinutes >= 60 ? 'bg-red-100 border-red-300' :
                t.idleMinutes >= 30 ? 'bg-amber-100 border-amber-300' :
                'bg-amber-50 border-amber-200'
              return (
                <div key={t.id} className={`border rounded-md p-3 ${severity}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-amber-900">
                        {t.taskType}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-800">
                        {t.agentCard.agentType}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700">
                        {t.status}
                      </span>
                      {t.progress !== null && (
                        <span className="text-xs text-amber-700">
                          {Math.round(t.progress * 100)}%
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
                      t.idleMinutes >= 60 ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {t.idleMinutes}분 무응답
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      href={t.project ? `/projects/${t.project.id}/chat` : '#'}
                      className="text-amber-900 hover:underline font-medium"
                    >
                      {t.project?.name ?? '—'}
                    </Link>
                    <span className="text-amber-600">
                      마지막 활동 {timeAgo(t.lastActivityAt)}
                    </span>
                  </div>
                  {t.lastUpdateBody && (
                    <div className="text-xs text-amber-700 mt-1 truncate italic">
                      마지막 메시지: {t.lastUpdateBody}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <WatchlistPanel keywords={watchKeywords} onRefresh={load} />

      <section className="border rounded-lg bg-card">
        <header className="flex items-center gap-3 px-4 py-3 border-b">
          <h2 className="font-semibold">크로스 프로젝트 피드</h2>
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="키워드 검색 (예: 긴급, 취소, bug_fix)"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border bg-background"
              />
            </div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              className="px-2 py-1.5 text-sm rounded-md border bg-background"
            >
              <option value="">모든 종류</option>
              <option value="TEXT">TEXT</option>
              <option value="COMMAND">COMMAND</option>
              <option value="STATUS">STATUS</option>
              <option value="AGENT_UPDATE">AGENT_UPDATE</option>
            </select>
          </div>
        </header>
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {loading && feed.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : feed.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              조건에 맞는 메시지가 없습니다.
            </div>
          ) : (
            feed.map((m) => <FeedRow key={m.id} m={m} q={q} />)
          )}
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | undefined
}) {
  return (
    <div className="border rounded-lg bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold">{value ?? '—'}</div>
    </div>
  )
}

const WATCH_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-200',
  red: 'bg-red-200',
  orange: 'bg-orange-200',
  green: 'bg-green-200',
  blue: 'bg-blue-200',
  purple: 'bg-purple-200',
}

function WatchlistPanel({
  keywords,
  onRefresh,
}: {
  keywords: WatchKeyword[]
  onRefresh: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [newKw, setNewKw] = useState('')
  const [newColor, setNewColor] = useState('yellow')

  const addKeyword = async () => {
    if (!newKw.trim()) return
    await apiClient.post('/api/admin/watchlist', { keyword: newKw.trim(), color: newColor })
    setNewKw('')
    setAdding(false)
    onRefresh()
  }

  const removeKeyword = async (id: string) => {
    await apiClient.delete(`/api/admin/watchlist/${id}`)
    onRefresh()
  }

  const toggleActive = async (id: string, active: boolean) => {
    await apiClient.patch(`/api/admin/watchlist/${id}`, { active: !active })
    onRefresh()
  }

  return (
    <section className="border rounded-lg bg-card">
      <header className="flex items-center justify-between px-4 py-2.5 border-b">
        <h2 className="flex items-center gap-2 font-semibold text-sm">
          <Eye size={14} />
          키워드 와치리스트
          <span className="text-xs text-muted-foreground font-normal">
            매칭 메시지가 피드에서 하이라이트됩니다
          </span>
        </h2>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-muted"
        >
          {adding ? <X size={12} /> : <Plus size={12} />}
          {adding ? '취소' : '추가'}
        </button>
      </header>
      <div className="p-3">
        {adding && (
          <div className="flex gap-2 mb-3">
            <input
              value={newKw}
              onChange={(e) => setNewKw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="키워드 (예: 긴급, 취소, 불만)"
              className="flex-1 px-2 py-1.5 text-sm rounded-md border bg-background"
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="px-2 py-1.5 text-sm rounded-md border bg-background"
            >
              {Object.keys(WATCH_COLORS).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={addKeyword}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground"
            >
              등록
            </button>
          </div>
        )}
        {keywords.length === 0 ? (
          <div className="text-xs text-muted-foreground italic py-2">
            등록된 키워드가 없습니다. "추가" 를 눌러 등록하세요.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw.id}
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                  kw.active
                    ? `${WATCH_COLORS[kw.color] ?? 'bg-yellow-200'} text-foreground`
                    : 'bg-muted text-muted-foreground line-through'
                }`}
              >
                <button onClick={() => toggleActive(kw.id, kw.active)} title="활성/비활성 토글">
                  {kw.keyword}
                </button>
                <button onClick={() => removeKeyword(kw.id)} className="opacity-50 hover:opacity-100">
                  <Trash2 size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FeedRow({ m, q }: { m: FeedItem; q: string }) {
  const kindTone: Record<string, string> = {
    COMMAND: 'bg-blue-500/10 text-blue-600',
    STATUS: 'bg-slate-500/10 text-slate-600',
    AGENT_UPDATE: 'bg-indigo-500/10 text-indigo-600',
    TEXT: 'bg-primary/10 text-primary',
  }
  const hasWatch = m.watchMatches && m.watchMatches.length > 0
  return (
    <div className={`px-4 py-3 text-sm hover:bg-muted/40 ${hasWatch ? 'border-l-2 border-yellow-400' : ''}`}>
      <div className="flex items-center gap-2 mb-1 text-xs">
        <Link
          href={`/projects/${m.project.id}/chat`}
          className="font-medium hover:underline"
        >
          {m.project.name}
        </Link>
        <span className="text-muted-foreground">·</span>
        <span className={`px-1.5 py-0.5 rounded ${kindTone[m.kind] ?? ''}`}>{m.kind}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {m.authorType === 'SYSTEM' ? 'System' : m.authorName}
        </span>
        {hasWatch && m.watchMatches!.map((wm) => (
          <span
            key={wm.keyword}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${WATCH_COLORS[wm.color] ?? 'bg-yellow-200'}`}
          >
            {wm.keyword}
          </span>
        ))}
        <span className="text-muted-foreground ml-auto">{timeAgo(m.createdAt)}</span>
      </div>
      <div className="whitespace-pre-wrap">{highlightMulti(m.body, q, m.watchMatches)}</div>
    </div>
  )
}

function highlight(text: string, q: string) {
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 px-0.5 rounded">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

function highlightMulti(
  text: string,
  q: string,
  watchMatches?: WatchMatch[],
): React.ReactNode {
  const terms: { term: string; color: string }[] = []
  if (q) terms.push({ term: q, color: 'yellow' })
  if (watchMatches) {
    for (const wm of watchMatches) {
      if (wm.keyword !== q.toLowerCase()) {
        terms.push({ term: wm.keyword, color: wm.color })
      }
    }
  }
  if (terms.length === 0) return text

  const escaped = terms.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(re)

  return (
    <>
      {parts.map((part, i) => {
        const match = terms.find(
          (t) => t.term.toLowerCase() === part.toLowerCase(),
        )
        return match ? (
          <mark key={i} className={`${WATCH_COLORS[match.color] ?? 'bg-yellow-200'} px-0.5 rounded`}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return `${d}일 전`
}
