'use client'

import { useEffect, useState, use, useCallback } from 'react'
import apiClient from '@/lib/api-client'
import {
  ListTree,
  ChevronRight,
  ChevronDown,
  Package,
  BookOpen,
  CheckSquare,
  Circle,
  PlayCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react'

type WorkItemType = 'EPIC' | 'STORY' | 'TASK'
type WorkItemStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
type Priority = 'P0' | 'P1' | 'P2' | 'P3'

interface WorkItem {
  id: string
  projectId: string
  parentId: string | null
  type: WorkItemType
  title: string
  status: WorkItemStatus
  priority: Priority
  storyPoints: number | null
  platform: string | null
  order: number
}

interface TreeNode extends WorkItem {
  children: TreeNode[]
  depth: number
  completionRate: number
}

const typeMeta: Record<WorkItemType, { icon: React.ReactNode; tone: string }> = {
  EPIC:  { icon: <Package size={12} />,     tone: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  STORY: { icon: <BookOpen size={12} />,    tone: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  TASK:  { icon: <CheckSquare size={12} />, tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
}

const statusMeta: Record<WorkItemStatus, { icon: React.ReactNode; tone: string; label: string }> = {
  BACKLOG:     { icon: <Circle size={11} />,        tone: 'text-muted-foreground',           label: 'Backlog' },
  IN_PROGRESS: { icon: <PlayCircle size={11} />,    tone: 'text-amber-600 dark:text-amber-400', label: 'In Progress' },
  REVIEW:      { icon: <Eye size={11} />,           tone: 'text-blue-600 dark:text-blue-400',   label: 'Review' },
  DONE:        { icon: <CheckCircle2 size={11} />,  tone: 'text-emerald-600 dark:text-emerald-400', label: 'Done' },
}

const priorityTone: Record<Priority, string> = {
  P0: 'bg-red-500/10 text-red-700 dark:text-red-400',
  P1: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  P2: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  P3: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
}

function buildTree(items: WorkItem[]): TreeNode[] {
  const byId = new Map<string, TreeNode>()
  items.forEach((w) => byId.set(w.id, { ...w, children: [], depth: 0, completionRate: 0 }))
  const roots: TreeNode[] = []
  items.forEach((w) => {
    const node = byId.get(w.id)!
    if (w.parentId && byId.has(w.parentId)) {
      const parent = byId.get(w.parentId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const computeRate = (n: TreeNode): number => {
    if (n.children.length === 0) return n.status === 'DONE' ? 1 : 0
    const sum = n.children.reduce((acc, c) => acc + computeRate(c), 0)
    n.completionRate = sum / n.children.length
    return n.completionRate
  }
  roots.forEach(computeRate)
  return roots
}

function depthFirstSort(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

function countTotal(nodes: TreeNode[]): number {
  let n = 0
  const walk = (list: TreeNode[]) => list.forEach((x) => { n++; walk(x.children) })
  walk(nodes)
  return n
}

function countDone(nodes: TreeNode[]): number {
  let n = 0
  const walk = (list: TreeNode[]) => list.forEach((x) => { if (x.status === 'DONE') n++; walk(x.children) })
  walk(nodes)
  return n
}

export default function WbsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const [items, setItems] = useState<WorkItem[]>([])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    apiClient
      .get<WorkItem[]>(`/api/projects/${projectId}/work-items`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => { load() }, [load])

  const toggle = (id: string) => {
    const next = new Set(collapsed)
    if (next.has(id)) next.delete(id); else next.add(id)
    setCollapsed(next)
  }

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => {
    // collapse every node that has children
    const all = new Set<string>()
    items.forEach((w) => { if (items.some((c) => c.parentId === w.id)) all.add(w.id) })
    setCollapsed(all)
  }

  const tree = buildTree(items)
  const total = countTotal(tree)
  const done = countDone(tree)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  if (loading) return <div className="text-sm text-muted-foreground">불러오는 중...</div>

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <ListTree size={18} className="text-sky-600" />
            WBS (Work Breakdown Structure)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Epic → Story → Task 계층 구조 + 하위 완료율 집계.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs px-2.5 py-1 rounded border hover:bg-muted"
          >
            모두 펼치기
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-2.5 py-1 rounded border hover:bg-muted"
          >
            모두 접기
          </button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-sky-500/5 to-transparent border border-sky-500/20 rounded-xl p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-xs text-muted-foreground">전체 진척률</div>
            <div className="text-3xl font-bold">
              {pct}%
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({done} / {total} 완료)
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>EPIC {items.filter((w) => w.type === 'EPIC').length}</div>
            <div>STORY {items.filter((w) => w.type === 'STORY').length}</div>
            <div>TASK {items.filter((w) => w.type === 'TASK').length}</div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      {tree.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <ListTree size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Work Item이 없습니다. 먼저 EPIC을 생성하세요.</p>
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_80px_60px_60px] gap-3 px-4 py-2.5 border-b bg-muted/40 text-[10px] font-medium text-muted-foreground uppercase">
            <div>Title</div>
            <div>Status</div>
            <div>Priority</div>
            <div className="text-right">Points</div>
            <div className="text-right">진척률</div>
          </div>
          <div className="divide-y divide-border">
            {depthFirstSort(tree).map((node) => (
              <TreeRow
                key={node.id}
                node={node}
                collapsed={collapsed}
                onToggle={toggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TreeRow({
  node,
  collapsed,
  onToggle,
}: {
  node: TreeNode
  collapsed: Set<string>
  onToggle: (id: string) => void
}) {
  const isCollapsed = collapsed.has(node.id)
  const hasChildren = node.children.length > 0
  const tMeta = typeMeta[node.type]
  const sMeta = statusMeta[node.status]
  const pct = hasChildren ? Math.round(node.completionRate * 100) : (node.status === 'DONE' ? 100 : 0)

  return (
    <>
      <div
        className="grid grid-cols-[1fr_100px_80px_60px_60px] gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors"
        style={{ paddingLeft: `${1 + node.depth * 1.5}rem` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button onClick={() => onToggle(node.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : (
            <span className="w-3.5 inline-block shrink-0" />
          )}
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${tMeta.tone}`}>
            {tMeta.icon}
            {node.type}
          </span>
          <span className="truncate">{node.title}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs ${sMeta.tone}`}>
          {sMeta.icon}
          <span>{sMeta.label}</span>
        </div>
        <div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityTone[node.priority]}`}>
            {node.priority}
          </span>
        </div>
        <div className="text-right text-xs font-mono text-muted-foreground">
          {node.storyPoints ?? '—'}
        </div>
        <div className="text-right text-xs">
          <div className="inline-flex items-center gap-1.5">
            <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[10px] tabular-nums">{pct}%</span>
          </div>
        </div>
      </div>
      {hasChildren && !isCollapsed &&
        depthFirstSort(node.children).map((child) => (
          <TreeRow key={child.id} node={child} collapsed={collapsed} onToggle={onToggle} />
        ))}
    </>
  )
}
