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
} from 'lucide-react'
import apiClient from '@/lib/api-client'
import { LinkHub } from '@/components/project/link-hub'
import { CredentialsVault } from '@/components/project/credentials-vault'
import type { Project, WorkItem } from 'shared-types'
import { WorkItemStatus, WorkItemType } from 'shared-types'

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
  { label: 'Work Items', href: '', icon: Kanban, tone: 'blue' },
  { label: 'Requirements', href: '/requirements', icon: FileText, tone: 'emerald' },
  { label: 'Design', href: '/design', icon: GitBranch, tone: 'violet' },
  { label: 'QA', href: '/qa', icon: FlaskConical, tone: 'amber' },
  { label: 'Chat', href: '/chat', icon: MessagesSquare, tone: 'sky' },
  { label: 'Feedback', href: '/feedback', icon: Inbox, tone: 'rose' },
  { label: 'Documents', href: '/documents', icon: Files, tone: 'teal' },
  { label: 'Source', href: '/source', icon: GitPullRequest, tone: 'fuchsia' },
  { label: 'Releases', href: '/releases', icon: Rocket, tone: 'indigo' },
]

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const [project, setProject] = useState<Project | null>(null)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])

  useEffect(() => {
    apiClient.get(`/api/projects/${id}`).then((r) => setProject(r.data))
    apiClient.get(`/api/projects/${id}/work-items`).then((r) => setWorkItems(r.data))
  }, [id])

  if (!project) return <div className="text-muted-foreground">Loading...</div>

  const base = `/projects/${id}`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
          <div className="flex gap-2 mt-2">
            {project.platforms.map((p) => (
              <span key={p} className="text-xs bg-muted px-2 py-1 rounded">{p}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`${base}/chat`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-sm"
          >
            <MessageSquare size={15} />
            대화방 열기
          </Link>
          <Link
            href={`${base}/feedback`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
          >
            <Inbox size={15} />
            피드백
          </Link>
        </div>
      </div>

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
