'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import type { Project, WorkItem } from 'shared-types'
import { WorkItemStatus, WorkItemType } from 'shared-types'

const SUB_NAV = [
  { label: 'Work Items', href: '' },
  { label: 'Requirements', href: '/requirements' },
  { label: 'Design', href: '/design' },
  { label: 'QA', href: '/qa' },
  { label: 'Chat', href: '/chat' },
  { label: 'Releases', href: '/releases' },
]

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])

  useEffect(() => {
    apiClient.get(`/api/projects/${id}`).then((r) => setProject(r.data))
    apiClient.get(`/api/projects/${id}/work-items`).then((r) => setWorkItems(r.data))
  }, [id])

  if (!project) return <div className="text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
        <div className="flex gap-2 mt-2">
          {project.platforms.map((p) => (
            <span key={p} className="text-xs bg-muted px-2 py-1 rounded">{p}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-4 border-b">
        {SUB_NAV.map(({ label, href }) => (
          <Link
            key={label}
            href={`/projects/${id}${href}`}
            className="pb-2 text-sm font-medium border-b-2 border-transparent hover:border-primary hover:text-primary text-muted-foreground transition-colors"
          >
            {label}
          </Link>
        ))}
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
