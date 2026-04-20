'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import {
  GitPullRequest,
  GitMerge,
  ExternalLink,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronLeft,
  Plus,
  Minus,
  AlertTriangle,
  Circle,
  Loader2,
} from 'lucide-react'

interface PullDetail {
  number: number
  title: string
  body: string | null
  state: string
  merged: boolean
  mergeable: boolean | null
  user: string
  head: string
  base: string
  headSha: string
  htmlUrl: string
  createdAt: string
  mergedAt: string | null
  additions: number
  deletions: number
  files: {
    filename: string
    status: string
    additions: number
    deletions: number
    patch: string | null
  }[]
  reviews: {
    user: string
    state: string
    body: string | null
    submittedAt: string | null
  }[]
}

interface CiStatus {
  state: 'success' | 'failure' | 'pending' | 'error'
  totalCount: number
  statuses: {
    context: string
    state: string
    description: string | null
    targetUrl: string | null
  }[]
}

export default function PrDetailPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>
}) {
  const { id, number: numStr } = use(params)
  const prNumber = Number(numStr)
  const [pr, setPr] = useState<PullDetail | null>(null)
  const [ci, setCi] = useState<CiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [reviewBody, setReviewBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<PullDetail>(
        `/api/projects/${id}/scm/pulls/${prNumber}`,
      )
      setPr(res.data)
      if (res.data.headSha) {
        try {
          const ciRes = await apiClient.get<CiStatus>(
            `/api/projects/${id}/scm/status/${res.data.headSha}`,
          )
          setCi(ciRes.data)
        } catch {}
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id, prNumber])

  useEffect(() => { void load() }, [load])

  const review = async (event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT') => {
    setActionLoading(true)
    try {
      await apiClient.post(`/api/projects/${id}/scm/pulls/${prNumber}/review`, {
        event,
        body: reviewBody || undefined,
      })
      setReviewBody('')
      await load()
    } finally {
      setActionLoading(false)
    }
  }

  const merge = async () => {
    setActionLoading(true)
    try {
      await apiClient.post(`/api/projects/${id}/scm/pulls/${prNumber}/merge`)
      await load()
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">불러오는 중...</div>
  if (error || !pr) {
    return (
      <div className="border border-red-200 bg-red-50 dark:bg-red-500/10 rounded-lg p-4 text-sm text-red-700">
        {error ?? 'PR을 불러올 수 없습니다.'}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <Link
        href={`/projects/${id}/source`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={12} /> Source로 돌아가기
      </Link>

      <header className="border border-border bg-card rounded-xl p-5">
        <div className="flex items-start gap-3 mb-2">
          <span className="mt-1 shrink-0">
            {pr.merged ? (
              <GitMerge size={18} className="text-violet-600" />
            ) : pr.state === 'closed' ? (
              <GitPullRequest size={18} className="text-red-600" />
            ) : (
              <GitPullRequest size={18} className="text-emerald-600" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">
              {pr.title} <span className="text-muted-foreground font-normal">#{pr.number}</span>
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                pr.merged ? 'bg-violet-500/10 text-violet-600' :
                pr.state === 'closed' ? 'bg-red-500/10 text-red-600' :
                'bg-emerald-500/10 text-emerald-600'
              }`}>
                {pr.merged ? 'merged' : pr.state}
              </span>
              <span>{pr.user}</span>
              <span className="font-mono">{pr.head} → {pr.base}</span>
              <span className="text-emerald-600">+{pr.additions}</span>
              <span className="text-red-600">-{pr.deletions}</span>
            </div>
          </div>
          {(pr.htmlUrl === '#' || !pr.htmlUrl) ? (
            <button
              onClick={() => alert('데모 모드 — 실제 PR이 아닙니다.')}
              className="shrink-0 h-8 px-3 inline-flex items-center gap-1 text-xs rounded-md border border-dashed bg-muted text-muted-foreground cursor-not-allowed"
            >
              GitHub (데모)
            </button>
          ) : (
            <a href={pr.htmlUrl} target="_blank" rel="noreferrer" className="shrink-0 h-8 px-3 inline-flex items-center gap-1 text-xs rounded-md border hover:bg-muted">
              GitHub <ExternalLink size={10} />
            </a>
          )}
        </div>
        {pr.body && (
          <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap border-t border-border pt-3">
            {pr.body}
          </div>
        )}
      </header>

      {ci && ci.totalCount > 0 && (
        <section className="border border-border bg-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CiStateIcon state={ci.state} />
            <span className="font-medium text-sm">
              CI — {ci.state} ({ci.totalCount})
            </span>
          </div>
          <div className="space-y-1.5">
            {ci.statuses.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <CiStateIcon state={s.state as CiStatus['state']} small />
                <span className="font-medium">{s.context}</span>
                {s.description && <span className="text-muted-foreground">— {s.description}</span>}
                {s.targetUrl && (
                  <a href={s.targetUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline ml-auto">
                    상세 <ExternalLink size={10} className="inline" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!pr.merged && pr.state === 'open' && (
        <section className="border border-border bg-card rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-sm">리뷰 작성</h3>
          <textarea
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            placeholder="선택 — 코멘트 없이 승인/반려 가능"
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded bg-background resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => review('APPROVE')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> 승인
            </button>
            <button
              onClick={() => review('REQUEST_CHANGES')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              <XCircle size={14} /> 변경 요청
            </button>
            <button
              onClick={() => review('COMMENT')}
              disabled={actionLoading || !reviewBody.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border hover:bg-muted disabled:opacity-50"
            >
              <MessageSquare size={14} /> 코멘트
            </button>
            <button
              onClick={merge}
              disabled={actionLoading || pr.mergeable === false}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-violet-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              <GitMerge size={14} /> Squash & Merge
            </button>
          </div>
          {pr.mergeable === false && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle size={12} /> 충돌이 있어 머지할 수 없습니다.
            </div>
          )}
        </section>
      )}

      {pr.reviews.length > 0 && (
        <section className="border border-border bg-card rounded-xl overflow-hidden">
          <header className="px-4 py-2.5 border-b border-border text-sm font-medium">
            리뷰 ({pr.reviews.length})
          </header>
          <ul className="divide-y divide-border">
            {pr.reviews.map((r, i) => (
              <li key={i} className="px-4 py-3">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="font-medium">{r.user}</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    r.state === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' :
                    r.state === 'CHANGES_REQUESTED' ? 'bg-red-500/10 text-red-600' :
                    'bg-muted text-muted-foreground'
                  }`}>{r.state}</span>
                  {r.submittedAt && (
                    <span className="text-muted-foreground ml-auto">
                      {new Date(r.submittedAt).toLocaleString('ko-KR')}
                    </span>
                  )}
                </div>
                {r.body && <div className="text-sm whitespace-pre-wrap">{r.body}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border border-border bg-card rounded-xl overflow-hidden">
        <header className="px-4 py-2.5 border-b border-border text-sm font-medium flex items-center justify-between">
          <span>파일 변경 ({pr.files.length})</span>
          <span className="text-xs text-muted-foreground">
            <span className="text-emerald-600">+{pr.additions}</span>
            {' '}
            <span className="text-red-600">-{pr.deletions}</span>
          </span>
        </header>
        <div className="divide-y divide-border">
          {pr.files.map((f, i) => (
            <details key={i} className="group" open={pr.files.length <= 3}>
              <summary className="px-4 py-2.5 cursor-pointer hover:bg-muted/40 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-mono truncate min-w-0">
                  <FileStatusBadge status={f.status} />
                  <span className="truncate">{f.filename}</span>
                </span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  <span className="text-emerald-600"><Plus size={10} className="inline" />{f.additions}</span>
                  {' '}
                  <span className="text-red-600"><Minus size={10} className="inline" />{f.deletions}</span>
                </span>
              </summary>
              {f.patch ? (
                <pre className="px-4 py-2 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre border-t border-border max-h-96 overflow-y-auto">
                  {f.patch.split('\n').map((line, li) => {
                    const cls =
                      line.startsWith('+') && !line.startsWith('+++')
                        ? 'text-emerald-400'
                        : line.startsWith('-') && !line.startsWith('---')
                          ? 'text-red-400'
                          : line.startsWith('@@')
                            ? 'text-violet-400'
                            : 'text-slate-300'
                    return <div key={li} className={cls}>{line}</div>
                  })}
                </pre>
              ) : (
                <div className="px-4 py-3 text-xs text-muted-foreground italic">Binary 또는 대용량 파일</div>
              )}
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}

function CiStateIcon({ state, small }: { state: string; small?: boolean }) {
  const size = small ? 12 : 14
  if (state === 'success') return <CheckCircle2 size={size} className="text-emerald-600" />
  if (state === 'failure' || state === 'error') return <XCircle size={size} className="text-red-600" />
  if (state === 'pending') return <Loader2 size={size} className="text-amber-600 animate-spin" />
  return <Circle size={size} className="text-muted-foreground" />
}

function FileStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'added' ? 'bg-emerald-500/10 text-emerald-600' :
    status === 'removed' ? 'bg-red-500/10 text-red-600' :
    status === 'renamed' ? 'bg-blue-500/10 text-blue-600' :
    'bg-muted text-muted-foreground'
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${tone}`}>{status}</span>
}
