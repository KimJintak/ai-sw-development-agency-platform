'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import {
  Activity,
  AlertTriangle,
  FolderKanban,
  MessageSquare,
  Search,
  ShieldAlert,
} from 'lucide-react'

type Kind = 'TEXT' | 'STATUS' | 'COMMAND' | 'AGENT_UPDATE' | ''

interface FeedItem {
  id: string
  projectId: string
  project: { id: string; name: string }
  authorType: 'USER' | 'AGENT' | 'SYSTEM'
  authorName: string
  kind: Exclude<Kind, ''>
  body: string
  createdAt: string
}

interface Stalled {
  id: string
  taskType: string
  status: string
  createdAt: string
  agentCard: { agentType: string; name: string }
  project: { id: string; name: string } | null
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
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<Kind>('')
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, f, st] = await Promise.all([
        apiClient.get<Summary>('/api/admin/ops/summary'),
        apiClient.get<FeedItem[]>('/api/admin/ops/feed', {
          params: { q: q || undefined, kind: kind || undefined, limit: 100 },
        }),
        apiClient.get<Stalled[]>('/api/admin/ops/stalled', { params: { minutes: 15 } }),
      ])
      setSummary(s.data)
      setFeed(f.data)
      setStalled(st.data)
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
            지연 레이더 · 15분 이상 미완료 태스크 ({stalled.length})
          </h2>
          <ul className="space-y-1.5 text-sm">
            {stalled.map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <span>
                  <span className="font-mono text-xs text-amber-800">{t.taskType}</span>
                  <span className="mx-2 text-amber-700">·</span>
                  <span className="text-amber-700">{t.agentCard.agentType}</span>
                  <span className="mx-2 text-amber-700">·</span>
                  <Link
                    href={t.project ? `/projects/${t.project.id}` : '#'}
                    className="text-amber-900 hover:underline"
                  >
                    {t.project?.name ?? '—'}
                  </Link>
                </span>
                <span className="text-xs text-amber-700">
                  {timeAgo(t.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

function FeedRow({ m, q }: { m: FeedItem; q: string }) {
  const kindTone: Record<string, string> = {
    COMMAND: 'bg-blue-500/10 text-blue-600',
    STATUS: 'bg-slate-500/10 text-slate-600',
    AGENT_UPDATE: 'bg-indigo-500/10 text-indigo-600',
    TEXT: 'bg-primary/10 text-primary',
  }
  return (
    <div className="px-4 py-3 text-sm hover:bg-muted/40">
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
        <span className="text-muted-foreground ml-auto">{timeAgo(m.createdAt)}</span>
      </div>
      <div className="whitespace-pre-wrap">{highlight(m.body, q)}</div>
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
