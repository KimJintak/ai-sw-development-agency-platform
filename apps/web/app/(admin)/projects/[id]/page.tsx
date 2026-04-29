'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  MessageSquare,
  Inbox,
  Kanban,
  FileText,
  GitBranch,
  FlaskConical,
  MessagesSquare,
  Rocket,
  Files,
  GitPullRequest,
  HelpCircle,
  ListTree,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Github,
  Database,
  Info,
} from 'lucide-react'
import apiClient from '@/lib/api-client'
import { useI18n } from '@/lib/i18n/i18n-context'
import { LinkHub } from '@/components/project/link-hub'
import { CredentialsVault } from '@/components/project/credentials-vault'
import type { Project, WorkItem } from 'shared-types'
import { WorkItemStatus, WorkItemType } from 'shared-types'

const TOPIC_TO_PLATFORM: Record<string, string> = {
  ios: 'IOS', iphone: 'IOS', swift: 'IOS', swiftui: 'IOS',
  android: 'ANDROID', kotlin: 'ANDROID',
  web: 'WEB', frontend: 'WEB', react: 'WEB', nextjs: 'WEB', vue: 'WEB', angular: 'WEB',
  macos: 'MACOS', mac: 'MACOS', electron: 'MACOS',
  windows: 'WINDOWS', dotnet: 'WINDOWS', wpf: 'WINDOWS', winforms: 'WINDOWS',
  linux: 'LINUX', ubuntu: 'LINUX',
}

function inferPlatforms(topics: string[], language: string | null): string[] {
  const found = new Set<string>()
  for (const t of topics) {
    const p = TOPIC_TO_PLATFORM[t.toLowerCase()]
    if (p) found.add(p)
  }
  if (language) {
    const p = TOPIC_TO_PLATFORM[language.toLowerCase()]
    if (p) found.add(p)
  }
  return Array.from(found)
}

type TabTone = {
  accent: string
  activeBg: string
  activeText: string
  activeBorder: string
  idleText: string
  idleBg: string
  idleHover: string
  bar: string
}

const TONES: Record<string, TabTone> = {
  blue: {
    accent: 'text-blue-600 dark:text-blue-400',
    activeBg: 'bg-blue-50 dark:bg-blue-500/10',
    activeText: 'text-blue-700 dark:text-blue-300',
    activeBorder: 'border-blue-300 dark:border-blue-500/40',
    idleText: 'text-blue-700/60 dark:text-blue-400/50',
    idleBg: 'bg-blue-500/5',
    idleHover: 'hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300',
    bar: 'bg-blue-500',
  },
  emerald: {
    accent: 'text-emerald-600 dark:text-emerald-400',
    activeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    activeText: 'text-emerald-700 dark:text-emerald-300',
    activeBorder: 'border-emerald-300 dark:border-emerald-500/40',
    idleText: 'text-emerald-700/60 dark:text-emerald-400/50',
    idleBg: 'bg-emerald-500/5',
    idleHover: 'hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  violet: {
    accent: 'text-violet-600 dark:text-violet-400',
    activeBg: 'bg-violet-50 dark:bg-violet-500/10',
    activeText: 'text-violet-700 dark:text-violet-300',
    activeBorder: 'border-violet-300 dark:border-violet-500/40',
    idleText: 'text-violet-700/60 dark:text-violet-400/50',
    idleBg: 'bg-violet-500/5',
    idleHover: 'hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300',
    bar: 'bg-violet-500',
  },
  amber: {
    accent: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-50 dark:bg-amber-500/10',
    activeText: 'text-amber-700 dark:text-amber-300',
    activeBorder: 'border-amber-300 dark:border-amber-500/40',
    idleText: 'text-amber-700/60 dark:text-amber-400/50',
    idleBg: 'bg-amber-500/5',
    idleHover: 'hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300',
    bar: 'bg-amber-500',
  },
  sky: {
    accent: 'text-sky-600 dark:text-sky-400',
    activeBg: 'bg-sky-50 dark:bg-sky-500/10',
    activeText: 'text-sky-700 dark:text-sky-300',
    activeBorder: 'border-sky-300 dark:border-sky-500/40',
    idleText: 'text-sky-700/60 dark:text-sky-400/50',
    idleBg: 'bg-sky-500/5',
    idleHover: 'hover:bg-sky-500/10 hover:text-sky-700 dark:hover:text-sky-300',
    bar: 'bg-sky-500',
  },
  rose: {
    accent: 'text-rose-600 dark:text-rose-400',
    activeBg: 'bg-rose-50 dark:bg-rose-500/10',
    activeText: 'text-rose-700 dark:text-rose-300',
    activeBorder: 'border-rose-300 dark:border-rose-500/40',
    idleText: 'text-rose-700/60 dark:text-rose-400/50',
    idleBg: 'bg-rose-500/5',
    idleHover: 'hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300',
    bar: 'bg-rose-500',
  },
  indigo: {
    accent: 'text-indigo-600 dark:text-indigo-400',
    activeBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    activeText: 'text-indigo-700 dark:text-indigo-300',
    activeBorder: 'border-indigo-300 dark:border-indigo-500/40',
    idleText: 'text-indigo-700/60 dark:text-indigo-400/50',
    idleBg: 'bg-indigo-500/5',
    idleHover: 'hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300',
    bar: 'bg-indigo-500',
  },
  teal: {
    accent: 'text-teal-600 dark:text-teal-400',
    activeBg: 'bg-teal-50 dark:bg-teal-500/10',
    activeText: 'text-teal-700 dark:text-teal-300',
    activeBorder: 'border-teal-300 dark:border-teal-500/40',
    idleText: 'text-teal-700/60 dark:text-teal-400/50',
    idleBg: 'bg-teal-500/5',
    idleHover: 'hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300',
    bar: 'bg-teal-500',
  },
  fuchsia: {
    accent: 'text-fuchsia-600 dark:text-fuchsia-400',
    activeBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10',
    activeText: 'text-fuchsia-700 dark:text-fuchsia-300',
    activeBorder: 'border-fuchsia-300 dark:border-fuchsia-500/40',
    idleText: 'text-fuchsia-700/60 dark:text-fuchsia-400/50',
    idleBg: 'bg-fuchsia-500/5',
    idleHover: 'hover:bg-fuchsia-500/10 hover:text-fuchsia-700 dark:hover:text-fuchsia-300',
    bar: 'bg-fuchsia-500',
  },
}

const SUB_NAV: { label: string; href: string; icon: typeof Kanban; tone: keyof typeof TONES }[] = [
  { label: 'Info', href: '/info', icon: Info, tone: 'blue' },
  { label: 'Work Items', href: '', icon: Kanban, tone: 'blue' },
  { label: 'WBS', href: '/wbs', icon: ListTree, tone: 'sky' },
  { label: 'Requirements', href: '/requirements', icon: FileText, tone: 'emerald' },
  { label: 'ERD', href: '/erd', icon: Database, tone: 'teal' },
  { label: 'Design', href: '/design', icon: GitBranch, tone: 'violet' },
  { label: 'QA', href: '/qa', icon: FlaskConical, tone: 'amber' },
  { label: 'Chat', href: '/chat', icon: MessagesSquare, tone: 'sky' },
  { label: 'Feedback', href: '/feedback', icon: Inbox, tone: 'rose' },
  { label: 'Documents', href: '/documents', icon: Files, tone: 'teal' },
  { label: 'Q&A', href: '/qna', icon: HelpCircle, tone: 'rose' },
  { label: 'Source', href: '/source', icon: GitPullRequest, tone: 'fuchsia' },
  { label: 'Releases', href: '/releases', icon: Rocket, tone: 'indigo' },
]

interface RepoMeta {
  name: string
  description: string | null
  topics: string[]
  language: string | null
}

interface SyncPreview {
  repoMeta: RepoMeta
  changes: { field: string; from: string; to: string }[]
}

const GENERATE_SECTIONS = [
  { key: 'workItems', label: 'Work Items', desc: 'EPIC / STORY 자동 생성' },
  { key: 'documents', label: '문서', desc: 'README 기반 PRD / 기술 문서' },
  { key: 'qna', label: 'Q&A', desc: '자주 묻는 기술 질문' },
  { key: 'erd', label: 'DB ERD', desc: 'Mermaid ERD 다이어그램 자동 생성' },
] as const

export default function ProjectDetailPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const [project, setProject] = useState<Project | null>(null)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncPreview, setSyncPreview] = useState<SyncPreview | null>(null)
  const [syncApplying, setSyncApplying] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [selectedSections, setSelectedSections] = useState<string[]>(['workItems', 'documents', 'qna'])
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<{ workItemsCreated: number; documentsCreated: number; qnaCreated: number; erdCreated: number } | null>(null)
  useEffect(() => {
    apiClient.get(`/api/projects/${id}`).then((r) => {
      const p = r.data
      setProject(p)
    })
    apiClient.get(`/api/projects/${id}/work-items`).then((r) => setWorkItems(r.data))
  }, [id])

  const openSyncPreview = async () => {
    if (!project) return
    setSyncLoading(true)
    try {
      const res = await apiClient.get<RepoMeta>(`/api/projects/${id}/scm/repo`)
      const meta = res.data
      const inferred = inferPlatforms(meta.topics, meta.language)
      const changes: { field: string; from: string; to: string }[] = []
      if (meta.name && meta.name !== project.name)
        changes.push({ field: '프로젝트 이름', from: project.name, to: meta.name })
      if (meta.description && meta.description !== (project.description ?? ''))
        changes.push({ field: '설명', from: project.description ?? '(없음)', to: meta.description })
      if (inferred.length > 0 && JSON.stringify(inferred.sort()) !== JSON.stringify([...project.platforms].sort()))
        changes.push({ field: '플랫폼', from: project.platforms.join(', ') || '(없음)', to: inferred.join(', ') })
      setSyncPreview({ repoMeta: meta, changes })
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      alert(msg ?? 'GitHub 저장소 정보를 가져오지 못했습니다.')
    } finally {
      setSyncLoading(false)
    }
  }

  const applySync = async () => {
    if (!syncPreview || !project) return
    setSyncApplying(true)
    const meta = syncPreview.repoMeta
    const inferred = inferPlatforms(meta.topics, meta.language)
    const patch: Record<string, unknown> = {}
    if (meta.name && meta.name !== project.name) patch.name = meta.name
    if (meta.description && meta.description !== (project.description ?? '')) patch.description = meta.description
    if (inferred.length > 0) patch.platforms = inferred
    try {
      await apiClient.patch(`/api/projects/${id}`, patch)
      const updated = await apiClient.get(`/api/projects/${id}`)
      setProject(updated.data)
      setSyncPreview(null)
      setSyncDone(true)
      setTimeout(() => setSyncDone(false), 3000)
    } catch {
      alert('업데이트에 실패했습니다.')
    } finally {
      setSyncApplying(false)
    }
  }

  const applyGenerate = async () => {
    if (selectedSections.length === 0) return
    setGenerating(true)
    setGenerateResult(null)
    try {
      const res = await apiClient.post<{ workItemsCreated: number; documentsCreated: number; qnaCreated: number; erdCreated: number }>(
        `/api/projects/${id}/scm/generate`,
        { sections: selectedSections },
      )
      setGenerateResult(res.data)
      if (selectedSections.includes('workItems')) {
        apiClient.get(`/api/projects/${id}/work-items`).then((r) => setWorkItems(r.data))
      }
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      alert(msg ?? '콘텐츠 생성에 실패했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  if (!project) return <div className="text-muted-foreground">Loading...</div>

  const base = `/projects/${id}`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {project.platforms.map((p) => (
              <span key={p} className="text-xs bg-muted px-2 py-1 rounded">{p}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(project as Project & { githubRepo?: string }).githubRepo && (
            <button
              onClick={openSyncPreview}
              disabled={syncLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm hover:bg-muted disabled:opacity-60"
              title="GitHub에서 프로젝트 정보 다시읽기"
            >
              {syncLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Git에서 다시읽기
            </button>
          )}
          {syncDone && (
            <span className="text-xs text-emerald-600 font-medium">✓ 업데이트 완료</span>
          )}
          <Link
            href={`${base}/chat`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-sm"
          >
            <MessageSquare size={15} />
            {t('project.openChat')}
          </Link>
          <Link
            href={`${base}/feedback`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
          >
            <Inbox size={15} />
            {t('project.feedback')}
          </Link>
        </div>
      </div>

      {syncPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background border rounded-xl shadow-xl w-full max-w-lg space-y-0 overflow-hidden">

            {/* 1단계: 프로젝트 정보 덮어쓰기 */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle size={18} />
                <h2 className="font-semibold text-base">Git에서 다시읽기</h2>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">① 프로젝트 기본 정보 업데이트</p>
                {syncPreview.changes.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted rounded-md px-4 py-3">변경할 내용이 없습니다.</div>
                ) : (
                  <div className="rounded-md border divide-y text-sm overflow-hidden">
                    {syncPreview.changes.map((c) => (
                      <div key={c.field} className="px-4 py-2.5 space-y-1">
                        <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">{c.field}</div>
                        <div className="flex items-center gap-2">
                          <span className="line-through text-muted-foreground truncate flex-1">{c.from}</span>
                          <span className="text-muted-foreground shrink-0">→</span>
                          <span className="text-foreground font-medium truncate flex-1">{c.to}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2단계: LLM 콘텐츠 생성 */}
              <div>
                <p className="text-sm font-medium mb-2">② LLM으로 프로젝트 콘텐츠 자동 생성 <span className="text-muted-foreground font-normal">(README 분석)</span></p>
                <div className="space-y-2">
                  {GENERATE_SECTIONS.map((s) => (
                    <label key={s.key} className="flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={selectedSections.includes(s.key)}
                        onChange={(e) => setSelectedSections((prev) =>
                          e.target.checked ? [...prev, s.key] : prev.filter((k) => k !== s.key)
                        )}
                        className="w-4 h-4 accent-primary"
                      />
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-xs text-muted-foreground">{s.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {generateResult && (
                  <div className="mt-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 rounded-md px-4 py-2.5 space-y-0.5">
                    <div className="font-medium">✓ 생성 완료</div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400">
                      Work Items {generateResult.workItemsCreated}개 · 문서 {generateResult.documentsCreated}개 · Q&A {generateResult.qnaCreated}개 · ERD {generateResult.erdCreated}개
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 bg-muted/40 border-t">
              <button onClick={() => { setSyncPreview(null); setGenerateResult(null) }}
                className="px-4 py-2 text-sm rounded-md border hover:bg-muted bg-background">
                닫기
              </button>
              {selectedSections.length > 0 && !generateResult && (
                <button onClick={applyGenerate} disabled={generating}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  {generating && <Loader2 size={13} className="animate-spin" />}
                  {generating ? 'AI 분석 중...' : `콘텐츠 생성 (${selectedSections.length}개 섹션)`}
                </button>
              )}
              {syncPreview.changes.length > 0 && (
                <button onClick={applySync} disabled={syncApplying}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60">
                  {syncApplying && <Loader2 size={13} className="animate-spin" />}
                  {syncApplying ? '적용 중...' : '기본정보 덮어쓰기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <LinkHub projectId={id} />

      <CredentialsVault projectId={id} />

      <div className="relative">
        <div className="flex gap-1 overflow-x-auto pb-0 pt-1 px-1 -mx-1">
          {SUB_NAV.map(({ label, href, icon: Icon, tone }) => {
            const target = `${base}${href}`
            const active = pathname === target
            const t = TONES[tone]
            return (
              <Link
                key={label}
                href={target}
                className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap rounded-t-lg border-x border-t transition-all ${
                  active
                    ? `${t.activeBg} ${t.activeText} ${t.activeBorder} font-semibold shadow-[0_-1px_3px_rgba(0,0,0,0.06)] -mb-px z-10`
                    : `${t.idleBg} ${t.idleText} border-transparent ${t.idleHover} hover:-translate-y-0.5`
                }`}
              >
                <Icon size={14} className={active ? t.accent : t.idleText} />
                {label}
                {active && (
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 top-0 h-0.5 w-10 rounded-full ${t.bar}`}
                  />
                )}
              </Link>
            )
          })}
        </div>
        <div className="h-px bg-border" />
      </div>

      <KanbanBoard workItems={workItems} onStatusChange={(itemId, status) => {
        apiClient.patch(`/api/projects/${id}/work-items/${itemId}/status`, { status })
          .then(() => apiClient.get(`/api/projects/${id}/work-items`).then((r) => setWorkItems(r.data)))
      }} />
    </div>
  )
}

function KanbanBoard({
  workItems,
  onStatusChange,
}: {
  workItems: WorkItem[]
  onStatusChange: (id: string, status: WorkItemStatus) => void
}) {
  const columns = [
    { key: WorkItemStatus.BACKLOG, label: 'Backlog' },
    { key: WorkItemStatus.IN_PROGRESS, label: 'In Progress' },
    { key: WorkItemStatus.REVIEW, label: 'Review' },
    { key: WorkItemStatus.DONE, label: 'Done' },
  ]

  const byStatus = (status: WorkItemStatus) =>
    workItems.filter((w) => w.status === status && !w.parentId)

  const typeBadge = (type: WorkItemType) => {
    const colors = {
      [WorkItemType.EPIC]: 'bg-purple-100 text-purple-700',
      [WorkItemType.STORY]: 'bg-blue-100 text-blue-700',
      [WorkItemType.TASK]: 'bg-gray-100 text-gray-600',
    }
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[type]}`}>{type}</span>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map(({ key, label }) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{byStatus(key).length}</span>
          </div>
          <div className="space-y-2 min-h-24">
            {byStatus(key).map((item) => (
              <div key={item.id} className="bg-card border rounded-md p-3 shadow-sm space-y-2">
                <div className="flex items-start gap-2">
                  {typeBadge(item.type)}
                  <p className="text-sm font-medium leading-tight flex-1">{item.title}</p>
                </div>
                {item.platform && (
                  <span className="text-xs text-muted-foreground">{item.platform}</span>
                )}
                <select
                  value={item.status}
                  onChange={(e) => onStatusChange(item.id, e.target.value as WorkItemStatus)}
                  className="w-full text-xs border rounded px-2 py-1 bg-background"
                >
                  {Object.values(WorkItemStatus).map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
