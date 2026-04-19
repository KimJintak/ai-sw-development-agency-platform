'use client'

import { useCallback, useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  HelpCircle,
  Wrench,
  Package,
  GitBranch,
  Rocket,
  CheckCircle2,
  Circle,
  Clock,
  RefreshCw,
  ExternalLink,
  History,
  User,
  ArrowRight,
  Paperclip,
  Image as ImageIcon,
  FileIcon,
  Download,
  Trash2,
} from 'lucide-react'
import apiClient from '@/lib/api-client'
import { useCurrentUser, hasRole } from '@/lib/auth/current-user-context'

type FeedbackType = 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'QUESTION'
type FeedbackStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DUPLICATE'
type Priority = 'P0' | 'P1' | 'P2' | 'P3'
type WorkItemStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
type ReleaseStatus = 'DRAFT' | 'TESTING' | 'APPROVED' | 'DEPLOYING' | 'DEPLOYED' | 'ROLLED_BACK'
type BuildStatus = 'PENDING' | 'BUILDING' | 'SUCCESS' | 'FAILED'

interface Feedback {
  id: string
  projectId: string
  title: string
  body: string
  source: string
  type: FeedbackType | null
  severity: Priority | null
  status: FeedbackStatus
  workItemId: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  workItem?: { id: string; title: string; status: WorkItemStatus } | null
  attachments?: AttachmentMeta[]
}

interface AttachmentMeta {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

interface WorkItem {
  id: string
  title: string
  status: WorkItemStatus
  type: string
  priority: Priority
  assignedAgent: string | null
  createdAt: string
  updatedAt: string
  agentTask?: { id: string; status: string; taskType: string } | null
}

interface Release {
  id: string
  version: string
  title: string | null
  status: ReleaseStatus
  platforms: string[]
  approvedAt: string | null
  deployedAt: string | null
  createdAt: string
}

interface ReleaseDetail extends Release {
  releaseItems: { workItem: { id: string; title: string } }[]
  builds: {
    id: string
    platform: string
    status: BuildStatus
    cloudfrontUrl: string | null
    completedAt: string | null
  }[]
}

interface StatusHistoryEntry {
  id: string
  fromStatus: FeedbackStatus | null
  toStatus: FeedbackStatus
  changedBy: string | null
  changedById: string | null
  reason: string | null
  createdAt: string
}

const typeIcon: Record<FeedbackType, React.ReactNode> = {
  BUG: <Bug size={16} className="text-red-600" />,
  FEATURE: <Lightbulb size={16} className="text-blue-600" />,
  IMPROVEMENT: <Wrench size={16} className="text-amber-600" />,
  QUESTION: <HelpCircle size={16} className="text-purple-600" />,
}

const severityStyle: Record<Priority, string> = {
  P0: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  P1: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  P2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  P3: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
}

const fbStatusStyle: Record<FeedbackStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  TRIAGED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  DUPLICATE: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
}

const wiStatusStyle: Record<WorkItemStatus, string> = {
  BACKLOG: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  REVIEW: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
}

const FB_NEXT: Record<FeedbackStatus, FeedbackStatus[]> = {
  NEW: ['TRIAGED', 'DUPLICATE'],
  TRIAGED: ['IN_PROGRESS', 'DUPLICATE'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['IN_PROGRESS'],
  DUPLICATE: ['NEW'],
}

export default function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string; fbId: string }>
}) {
  const { id: projectId, fbId } = use(params)
  const { user } = useCurrentUser()
  const canManage = hasRole(user, 'ADMIN', 'PM')
  const [fb, setFb] = useState<Feedback | null>(null)
  const [workItem, setWorkItem] = useState<WorkItem | null>(null)
  const [linkedReleases, setLinkedReleases] = useState<ReleaseDetail[]>([])
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: feedback } = await apiClient.get<Feedback>(`/api/feedback/${fbId}`)
      setFb(feedback)

      apiClient
        .get<StatusHistoryEntry[]>(`/api/feedback/${fbId}/history`)
        .then((r) => setHistory(r.data))
        .catch(() => setHistory([]))

      if (feedback.workItemId) {
        const { data: wi } = await apiClient.get<WorkItem>(
          `/api/projects/${projectId}/work-items/${feedback.workItemId}`,
        )
        setWorkItem(wi)

        const { data: releases } = await apiClient.get<Release[]>(
          `/api/projects/${projectId}/releases`,
        )
        const details = await Promise.all(
          releases.map((r) =>
            apiClient
              .get<ReleaseDetail>(`/api/releases/${r.id}`)
              .then((res) => res.data)
              .catch(() => null),
          ),
        )
        setLinkedReleases(
          details.filter((r): r is ReleaseDetail =>
            !!r && r.releaseItems.some((ri) => ri.workItem.id === feedback.workItemId),
          ),
        )
      } else {
        setWorkItem(null)
        setLinkedReleases([])
      }
    } catch (e) {
      setError((e as Error).message || '데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [fbId, projectId])

  useEffect(() => {
    load()
  }, [load])

  const changeStatus = async (next: FeedbackStatus) => {
    setActionBusy(true)
    try {
      await apiClient.patch(`/api/feedback/${fbId}/status`, { status: next })
      await load()
    } finally {
      setActionBusy(false)
    }
  }

  const retriage = async () => {
    setActionBusy(true)
    try {
      await apiClient.post(`/api/feedback/${fbId}/retriage`)
      await load()
    } finally {
      setActionBusy(false)
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">불러오는 중...</div>
  if (error) return <div className="text-sm text-destructive">{error}</div>
  if (!fb) return <div className="text-sm text-muted-foreground">피드백을 찾을 수 없습니다.</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href={`/projects/${projectId}/feedback`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        피드백 목록
      </Link>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {fb.type && typeIcon[fb.type]}
            <h1 className="text-xl font-bold">{fb.title}</h1>
            {fb.severity && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${severityStyle[fb.severity]}`}>
                {fb.severity}
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${fbStatusStyle[fb.status]}`}>
              {fb.status}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <button
                onClick={retriage}
                disabled={actionBusy}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border hover:bg-muted disabled:opacity-50"
                title="type/severity 재계산"
              >
                <RefreshCw size={12} />
                재분류
              </button>
            )}
          </div>
        </div>
        {fb.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{fb.body}</p>}
        <div className="text-xs text-muted-foreground">
          {fb.source} · 등록 {new Date(fb.createdAt).toLocaleString('ko-KR')}
          {fb.resolvedAt && ` · 해결 ${new Date(fb.resolvedAt).toLocaleString('ko-KR')}`}
        </div>

        {canManage && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">상태 변경:</span>
            {FB_NEXT[fb.status].map((n) => (
              <button
                key={n}
                onClick={() => changeStatus(n)}
                disabled={actionBusy}
                className={`text-xs px-2.5 py-1 rounded-full font-medium hover:opacity-80 disabled:opacity-50 ${fbStatusStyle[n]}`}
              >
                → {n}
              </button>
            ))}
          </div>
        )}
      </div>

      <Attachments
        attachments={fb.attachments ?? []}
        onDeleted={load}
        canDelete={canManage}
      />

      <TraceTimeline fb={fb} workItem={workItem} releases={linkedReleases} />

      <StatusHistory history={history} />

      <section className="rounded-lg border bg-card">
        <header className="px-4 py-3 border-b flex items-center gap-2">
          <Package size={15} className="text-primary" />
          <h2 className="font-semibold text-sm">Work Item 연결</h2>
        </header>
        <div className="p-4">
          {!workItem ? (
            <div className="text-sm text-muted-foreground">
              연결된 Work Item이 없습니다. 상태를 TRIAGED 이상으로 변경하면 자동 생성되거나,
              수동으로 Work Item을 연결해야 합니다.
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/projects/${projectId}#wi-${workItem.id}`}
                  className="font-medium hover:text-primary flex items-center gap-1"
                >
                  {workItem.title}
                  <ExternalLink size={12} />
                </Link>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${wiStatusStyle[workItem.status]}`}>
                  {workItem.status}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-muted">{workItem.type}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${severityStyle[workItem.priority]}`}>
                  {workItem.priority}
                </span>
              </div>
              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                <span>담당 에이전트: {workItem.assignedAgent ?? '미배정'}</span>
                <span>업데이트: {new Date(workItem.updatedAt).toLocaleString('ko-KR')}</span>
                {workItem.agentTask && (
                  <span className="col-span-2">
                    Agent Task: {workItem.agentTask.taskType} · {workItem.agentTask.status}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <header className="px-4 py-3 border-b flex items-center gap-2">
          <Rocket size={15} className="text-primary" />
          <h2 className="font-semibold text-sm">릴리스 / 배포 이력</h2>
          <span className="ml-auto text-xs text-muted-foreground">{linkedReleases.length}건</span>
        </header>
        <div className="divide-y">
          {linkedReleases.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {workItem
                ? '아직 이 Work Item이 포함된 릴리스가 없습니다.'
                : 'Work Item이 연결되지 않아 릴리스를 추적할 수 없습니다.'}
            </div>
          ) : (
            linkedReleases.map((r) => (
              <div key={r.id} className="p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/projects/${projectId}/releases`}
                    className="font-medium hover:text-primary flex items-center gap-1"
                  >
                    <GitBranch size={12} />
                    v{r.version}
                    {r.title && ` · ${r.title}`}
                  </Link>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${releaseStatusCls(r.status)}`}>
                    {r.status}
                  </span>
                  {r.platforms.map((p) => (
                    <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {r.deployedAt
                      ? `배포 ${new Date(r.deployedAt).toLocaleDateString('ko-KR')}`
                      : r.approvedAt
                        ? `승인 ${new Date(r.approvedAt).toLocaleDateString('ko-KR')}`
                        : `생성 ${new Date(r.createdAt).toLocaleDateString('ko-KR')}`}
                  </span>
                </div>
                {r.builds.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {r.builds.map((b) => (
                      <span
                        key={b.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${buildCls(b.status)}`}
                      >
                        {b.platform}: {b.status}
                        {b.cloudfrontUrl && (
                          <a
                            href={b.cloudfrontUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-primary"
                          >
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function TraceTimeline({
  fb,
  workItem,
  releases,
}: {
  fb: Feedback
  workItem: WorkItem | null
  releases: ReleaseDetail[]
}) {
  const deployed = releases.find((r) => r.status === 'DEPLOYED' && r.deployedAt)
  const steps: {
    label: string
    done: boolean
    at?: string | null
    detail?: string
  }[] = [
    {
      label: '피드백 등록',
      done: true,
      at: fb.createdAt,
      detail: `${fb.source} · ${fb.type ?? '?'} / ${fb.severity ?? '?'}`,
    },
    {
      label: '분류 (Triage)',
      done: fb.status !== 'NEW' || !!fb.type,
      detail: fb.type ? `${fb.type} / ${fb.severity ?? '-'}` : '미분류',
    },
    {
      label: 'Work Item 생성',
      done: !!workItem,
      at: workItem?.createdAt,
      detail: workItem?.title,
    },
    {
      label: '개발 진행',
      done: !!workItem && ['IN_PROGRESS', 'REVIEW', 'DONE'].includes(workItem.status),
      detail: workItem?.assignedAgent ? `담당: ${workItem.assignedAgent}` : undefined,
    },
    {
      label: '개발 완료',
      done: workItem?.status === 'DONE',
      at: workItem?.status === 'DONE' ? workItem.updatedAt : undefined,
    },
    {
      label: '릴리스 포함',
      done: releases.length > 0,
      detail: releases.length > 0 ? releases.map((r) => `v${r.version}`).join(', ') : undefined,
    },
    {
      label: '배포 완료',
      done: !!deployed,
      at: deployed?.deployedAt,
      detail: deployed ? `v${deployed.version}` : undefined,
    },
    {
      label: '피드백 해결',
      done: fb.status === 'RESOLVED',
      at: fb.resolvedAt,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  const progress = Math.round((doneCount / steps.length) * 100)

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <CheckCircle2 size={15} className="text-primary" />
          반영 추적 ({doneCount} / {steps.length})
        </h2>
        <span className="text-xs text-muted-foreground">{progress}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              {s.done ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <Circle size={18} className="text-muted-foreground/40" />
              )}
              {i < steps.length - 1 && (
                <div className={`w-0.5 flex-1 mt-1 ${s.done ? 'bg-emerald-500/40' : 'bg-muted'}`} />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${s.done ? '' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {s.at && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(s.at).toLocaleString('ko-KR')}
                  </span>
                )}
              </div>
              {s.detail && <div className="text-xs text-muted-foreground mt-0.5">{s.detail}</div>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Attachments({
  attachments,
  onDeleted,
  canDelete,
}: {
  attachments: AttachmentMeta[]
  onDeleted: () => void
  canDelete: boolean
}) {
  if (attachments.length === 0) return null
  const downloadUrl = (id: string) => `/api/feedback/attachments/${id}`
  const onDelete = async (id: string) => {
    if (!confirm('첨부를 삭제할까요?')) return
    await apiClient.delete(`/api/feedback/attachments/${id}`)
    onDeleted()
  }
  return (
    <section className="rounded-lg border bg-card">
      <header className="px-4 py-3 border-b flex items-center gap-2">
        <Paperclip size={15} className="text-primary" />
        <h2 className="font-semibold text-sm">첨부 파일</h2>
        <span className="ml-auto text-xs text-muted-foreground">{attachments.length}개</span>
      </header>
      <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {attachments.map((a) => {
          const isImage = a.mimeType.startsWith('image/')
          return (
            <div
              key={a.id}
              className="border rounded-md overflow-hidden bg-muted/20 group"
            >
              {isImage ? (
                <a href={downloadUrl(a.id)} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={downloadUrl(a.id)}
                    alt={a.filename}
                    className="w-full h-32 object-cover"
                  />
                </a>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <FileIcon size={32} />
                </div>
              )}
              <div className="p-2 flex items-center gap-2 text-xs border-t bg-background">
                {isImage ? (
                  <ImageIcon size={12} className="text-primary shrink-0" />
                ) : (
                  <FileIcon size={12} className="text-muted-foreground shrink-0" />
                )}
                <span className="truncate flex-1" title={a.filename}>
                  {a.filename}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {(a.sizeBytes / 1024).toFixed(0)} KB
                </span>
                <a
                  href={downloadUrl(a.id)}
                  download={a.filename}
                  className="text-muted-foreground hover:text-primary"
                  title="다운로드"
                >
                  <Download size={12} />
                </a>
                {canDelete && (
                  <button
                    onClick={() => onDelete(a.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StatusHistory({ history }: { history: StatusHistoryEntry[] }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="px-4 py-3 border-b flex items-center gap-2">
        <History size={15} className="text-primary" />
        <h2 className="font-semibold text-sm">상태 변경 이력</h2>
        <span className="ml-auto text-xs text-muted-foreground">{history.length}건</span>
      </header>
      {history.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          아직 상태 변경 이력이 없습니다. (스키마 마이그레이션 이후 기록된 변경만 표시됩니다.)
        </div>
      ) : (
        <ol className="divide-y">
          {history.map((h) => (
            <li key={h.id} className="px-4 py-3 text-sm flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User size={12} />
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {h.fromStatus && (
                    <>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${fbStatusStyle[h.fromStatus]}`}>
                        {h.fromStatus}
                      </span>
                      <ArrowRight size={12} className="text-muted-foreground" />
                    </>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${fbStatusStyle[h.toStatus]}`}>
                    {h.toStatus}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(h.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {h.changedBy ?? <span className="italic">시스템</span>}
                  {h.reason && <span className="ml-2">· {h.reason}</span>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function releaseStatusCls(s: ReleaseStatus): string {
  return {
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
    TESTING: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    DEPLOYING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    DEPLOYED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
    ROLLED_BACK: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  }[s]
}

function buildCls(s: BuildStatus): string {
  return {
    PENDING: 'border-slate-300 text-slate-600',
    BUILDING: 'border-amber-300 text-amber-700',
    SUCCESS: 'border-emerald-300 text-emerald-700',
    FAILED: 'border-red-300 text-red-700',
  }[s]
}
