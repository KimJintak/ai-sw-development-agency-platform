'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bug,
  Lightbulb,
  HelpCircle,
  Wrench,
  Filter,
  Inbox,
  List,
  FolderKanban,
  ChevronRight,
  Plus,
  X,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react'
import apiClient from '@/lib/api-client'
import type { Project } from 'shared-types'
import { useCurrentUser, hasRole } from '@/lib/auth/current-user-context'

type FeedbackType = 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'QUESTION'
type FeedbackStatus = 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DUPLICATE'
type Priority = 'P0' | 'P1' | 'P2' | 'P3'
type Source = 'MANUAL' | 'PORTAL' | 'SENTRY' | 'API'

interface Feedback {
  id: string
  title: string
  body: string
  source: Source
  type: FeedbackType | null
  severity: Priority | null
  status: FeedbackStatus
  workItemId: string | null
  createdAt: string
}

interface FeedbackWithProject extends Feedback {
  projectId: string
  projectName: string
}

const typeIcon: Record<FeedbackType, React.ReactNode> = {
  BUG: <Bug size={14} className="text-red-600" />,
  FEATURE: <Lightbulb size={14} className="text-blue-600" />,
  IMPROVEMENT: <Wrench size={14} className="text-amber-600" />,
  QUESTION: <HelpCircle size={14} className="text-purple-600" />,
}

const severityStyle: Record<Priority, string> = {
  P0: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  P1: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  P2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  P3: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
}

const statusStyle: Record<FeedbackStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  TRIAGED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  DUPLICATE: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILE_COUNT = 5

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function FeedbackAggregatePage() {
  const { user } = useCurrentUser()
  const canCreate = hasRole(user, 'ADMIN', 'PM', 'CLIENT')
  const [items, setItems] = useState<FeedbackWithProject[]>([])
  const [projectsMeta, setProjectsMeta] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'ALL'>('ALL')
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat')

  const [creating, setCreating] = useState(false)
  const [newProjectId, setNewProjectId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        const { data: projects } = await apiClient.get<Project[]>('/api/projects')
        const results = await Promise.all(
          projects.map(async (p) => {
            try {
              const { data } = await apiClient.get<Feedback[]>(`/api/projects/${p.id}/feedback`)
              return data.map((fb) => ({ ...fb, projectId: p.id, projectName: p.name }))
            } catch {
              return []
            }
          }),
        )
        if (cancelled) return
        const all = results.flat().sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        setItems(all)
        setProjectsMeta(projects.map((p) => ({ id: p.id, name: p.name })))
      } catch (e) {
        if (!cancelled) setError((e as Error).message || '피드백을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (statusFilter !== 'ALL' && it.status !== statusFilter) return false
      if (typeFilter !== 'ALL' && it.type !== typeFilter) return false
      if (projectFilter !== 'ALL' && it.projectId !== projectFilter) return false
      return true
    })
  }, [items, statusFilter, typeFilter, projectFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, { projectId: string; projectName: string; items: FeedbackWithProject[] }>()
    for (const it of filtered) {
      const bucket = map.get(it.projectId) ?? {
        projectId: it.projectId,
        projectName: it.projectName,
        items: [],
      }
      bucket.items.push(it)
      map.set(it.projectId, bucket)
    }
    return [...map.values()].sort((a, b) => b.items.length - a.items.length)
  }, [filtered])

  const reload = async () => {
    try {
      const { data: projects } = await apiClient.get<Project[]>('/api/projects')
      const results = await Promise.all(
        projects.map(async (p) => {
          try {
            const { data } = await apiClient.get<Feedback[]>(`/api/projects/${p.id}/feedback`)
            return data.map((fb) => ({ ...fb, projectId: p.id, projectName: p.name }))
          } catch {
            return []
          }
        }),
      )
      const all = results.flat().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      setItems(all)
    } catch {}
  }

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateError(null)
    const picked = Array.from(e.target.files ?? [])
    const next = [...newFiles, ...picked]
    if (next.length > MAX_FILE_COUNT) {
      setCreateError(`최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`)
      return
    }
    const tooBig = next.find((f) => f.size > MAX_FILE_SIZE)
    if (tooBig) {
      setCreateError(`${tooBig.name}: 5MB를 초과합니다.`)
      return
    }
    setNewFiles(next)
    e.target.value = ''
  }

  const removeFile = (idx: number) => setNewFiles(newFiles.filter((_, i) => i !== idx))

  const submitCreate = async () => {
    if (!newProjectId) {
      setCreateError('프로젝트를 선택하세요.')
      return
    }
    if (!newTitle.trim() || submitting) return
    setSubmitting(true)
    setCreateError(null)
    try {
      const { data: fb } = await apiClient.post<{ id: string }>(
        `/api/projects/${newProjectId}/feedback`,
        {
          source: 'MANUAL',
          title: newTitle.trim(),
          body: newBody.trim(),
        },
      )
      if (newFiles.length > 0) {
        const payload = await Promise.all(
          newFiles.map(async (f) => ({
            filename: f.name,
            mimeType: f.type || 'application/octet-stream',
            sizeBytes: f.size,
            dataUrl: await fileToDataUrl(f),
          })),
        )
        await apiClient.post(`/api/feedback/${fb.id}/attachments`, { files: payload })
      }
      setNewTitle('')
      setNewBody('')
      setNewFiles([])
      setNewProjectId('')
      setCreating(false)
      await reload()
    } catch (e) {
      setCreateError((e as Error).message || '등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const counts = useMemo(() => {
    const out = { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0, BUG: 0, total: items.length }
    for (const it of items) {
      if (it.status === 'NEW') out.NEW++
      if (it.status === 'IN_PROGRESS') out.IN_PROGRESS++
      if (it.status === 'RESOLVED') out.RESOLVED++
      if (it.type === 'BUG') out.BUG++
    }
    return out
  }, [items])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">피드백</h1>
          <p className="text-sm text-muted-foreground mt-1">
            전 프로젝트의 고객 피드백 / 버그 리포트를 한 곳에서 확인합니다.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setCreating(!creating)}
            className="shrink-0 flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            {creating ? <X size={14} /> : <Plus size={14} />}
            {creating ? '취소' : '피드백 등록'}
          </button>
        )}
      </div>

      {canCreate && creating && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">프로젝트</label>
            <select
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded bg-background"
            >
              <option value="">프로젝트 선택...</option>
              {projectsMeta.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="제목"
            className="w-full px-3 py-2 text-sm border rounded bg-background"
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="상세 내용"
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded bg-background resize-none"
          />
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border hover:bg-muted cursor-pointer">
              <Paperclip size={12} />
              파일 추가
              <input
                type="file"
                multiple
                className="hidden"
                onChange={onPickFiles}
                accept="image/*,.pdf,.txt,.log,.json,.csv,.zip"
              />
            </label>
            <span className="ml-2 text-xs text-muted-foreground">
              파일당 5MB · 최대 {MAX_FILE_COUNT}개
            </span>
            {newFiles.length > 0 && (
              <ul className="space-y-1">
                {newFiles.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1"
                  >
                    {f.type.startsWith('image/') ? (
                      <ImageIcon size={12} className="text-primary" />
                    ) : (
                      <FileIcon size={12} className="text-muted-foreground" />
                    )}
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-muted-foreground shrink-0">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-destructive"
                      title="제거"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {createError && <div className="text-xs text-destructive">{createError}</div>}
          <div className="flex justify-end gap-2">
            <button
              onClick={submitCreate}
              disabled={submitting}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
            >
              {submitting ? '제출 중...' : '제출 (자동 분류됨)'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="전체" value={counts.total} />
        <StatChip label="신규" value={counts.NEW} tone="blue" />
        <StatChip label="진행 중" value={counts.IN_PROGRESS} tone="amber" />
        <StatChip label="해결됨" value={counts.RESOLVED} tone="green" />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Filter size={14} className="text-muted-foreground" />
        <FilterSelect
          value={projectFilter}
          onChange={setProjectFilter}
          options={[
            ['ALL', '전체 프로젝트'],
            ...projectsMeta.map((p) => [p.id, p.name] as [string, string]),
          ]}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as FeedbackStatus | 'ALL')}
          options={[
            ['ALL', '전체 상태'],
            ['NEW', 'NEW'],
            ['TRIAGED', 'TRIAGED'],
            ['IN_PROGRESS', 'IN_PROGRESS'],
            ['RESOLVED', 'RESOLVED'],
            ['DUPLICATE', 'DUPLICATE'],
          ]}
        />
        <FilterSelect
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as FeedbackType | 'ALL')}
          options={[
            ['ALL', '전체 유형'],
            ['BUG', 'BUG'],
            ['FEATURE', 'FEATURE'],
            ['IMPROVEMENT', 'IMPROVEMENT'],
            ['QUESTION', 'QUESTION'],
          ]}
        />

        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-md border bg-background p-0.5">
            <button
              onClick={() => setViewMode('flat')}
              title="전체 목록"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'flat'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List size={12} />
              전체
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              title="프로젝트별 그룹"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderKanban size={12} />
              프로젝트별
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} / {items.length}건
          </span>
        </div>
      </div>

      {error ? (
        <div className="border rounded-lg p-8 text-center text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <div className="text-sm text-muted-foreground">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Inbox size={28} className="mx-auto mb-2 opacity-50" />
          <div className="text-sm">조건에 맞는 피드백이 없습니다.</div>
        </div>
      ) : viewMode === 'flat' ? (
        <div className="border rounded-lg bg-card divide-y">
          {filtered.map((fb) => (
            <FeedbackRow key={fb.id} fb={fb} showProject />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <div key={g.projectId} className="border rounded-lg bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <FolderKanban size={14} className="text-primary" />
                  <Link
                    href={`/projects/${g.projectId}/feedback`}
                    className="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {g.projectName}
                    <ChevronRight size={14} />
                  </Link>
                  <span className="text-xs text-muted-foreground">{g.items.length}건</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <GroupBadge label="NEW" n={g.items.filter((i) => i.status === 'NEW').length} cls={statusStyle.NEW} />
                  <GroupBadge label="진행" n={g.items.filter((i) => i.status === 'IN_PROGRESS').length} cls={statusStyle.IN_PROGRESS} />
                  <GroupBadge label="해결" n={g.items.filter((i) => i.status === 'RESOLVED').length} cls={statusStyle.RESOLVED} />
                </div>
              </div>
              <div className="divide-y">
                {g.items.map((fb) => (
                  <FeedbackRow key={fb.id} fb={fb} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FeedbackRow({ fb, showProject }: { fb: FeedbackWithProject; showProject?: boolean }) {
  return (
    <Link
      href={`/projects/${fb.projectId}/feedback/${fb.id}`}
      className="block px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {fb.type && typeIcon[fb.type]}
        <span className="font-medium text-sm">{fb.title}</span>
        {fb.severity && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${severityStyle[fb.severity]}`}>
            {fb.severity}
          </span>
        )}
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusStyle[fb.status]}`}>
          {fb.status}
        </span>
        {fb.workItemId && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
            WorkItem 연결됨
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground shrink-0">
          {fb.source} · {new Date(fb.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {showProject && (
          <span className="px-1.5 py-0.5 rounded bg-muted font-medium">{fb.projectName}</span>
        )}
        {fb.body && <span className="truncate">{fb.body}</span>}
      </div>
    </Link>
  )
}

function GroupBadge({ label, n, cls }: { label: string; n: number; cls: string }) {
  if (n === 0) return null
  return (
    <span className={`px-2 py-0.5 rounded-full ${cls}`}>
      {label} {n}
    </span>
  )
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'blue' | 'amber' | 'green'
}) {
  const toneCls = {
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
  }
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${tone ? toneCls[tone] : ''}`}>{value}</div>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs border rounded-md px-2 py-1.5 bg-background"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  )
}
