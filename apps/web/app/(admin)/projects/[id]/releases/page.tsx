'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import {
  Package,
  Plus,
  Rocket,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  History,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react'

type ReleaseStatus = 'DRAFT' | 'TESTING' | 'APPROVED' | 'DEPLOYING' | 'DEPLOYED' | 'ROLLED_BACK'
type BuildStatus = 'PENDING' | 'BUILDING' | 'SUCCESS' | 'FAILED'
type Platform = 'MACOS' | 'WINDOWS' | 'IOS' | 'ANDROID' | 'WEB' | 'LINUX'

const PLATFORMS: Platform[] = ['MACOS', 'WINDOWS', 'IOS', 'ANDROID', 'WEB', 'LINUX']

interface Release {
  id: string
  version: string
  title: string | null
  status: ReleaseStatus
  platforms: string[]
  approvedAt: string | null
  deployedAt: string | null
  createdAt: string
  _count: { releaseItems: number; builds: number; testRuns: number }
}

interface Build {
  id: string
  platform: string
  status: BuildStatus
  s3Key: string | null
  cloudfrontUrl: string | null
  buildLog: string | null
  startedAt: string | null
  completedAt: string | null
}

interface WorkItemRef {
  id: string
  title: string
  status: string
  type: string
}

interface ReleaseDetail extends Omit<Release, '_count'> {
  releaseItems: { workItem: WorkItemRef }[]
  builds: Build[]
  prNumbers: number[]
}

interface WorkItem {
  id: string
  title: string
  status: string
  type: string
}

interface DeployRecord {
  id: string
  platform: string
  status: string
  cloudfrontUrl: string | null
  completedAt: string | null
  release: { id: string; version: string; title: string | null }
}

const statusStyle: Record<ReleaseStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  TESTING: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  DEPLOYING: 'bg-amber-100 text-amber-700',
  DEPLOYED: 'bg-emerald-100 text-emerald-800',
  ROLLED_BACK: 'bg-red-100 text-red-700',
}

const buildStatusIcon: Record<BuildStatus, React.ReactNode> = {
  PENDING: <Clock size={14} className="text-muted-foreground" />,
  BUILDING: <Clock size={14} className="text-amber-600 animate-spin" />,
  SUCCESS: <CheckCircle2 size={14} className="text-green-600" />,
  FAILED: <XCircle size={14} className="text-red-600" />,
}

export default function ReleasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const [tab, setTab] = useState<'releases' | 'history'>('releases')
  const [releases, setReleases] = useState<Release[]>([])
  const [selected, setSelected] = useState<ReleaseDetail | null>(null)
  const [creating, setCreating] = useState(false)
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['WEB'])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [deployHistory, setDeployHistory] = useState<DeployRecord[]>([])
  const [allWorkItems, setAllWorkItems] = useState<WorkItem[]>([])
  const [addingWI, setAddingWI] = useState(false)
  const [wiToAdd, setWiToAdd] = useState('')

  const load = useCallback(async () => {
    const r = await apiClient.get<Release[]>(`/api/projects/${projectId}/releases`)
    setReleases(r.data)
    setLoading(false)
  }, [projectId])

  const loadHistory = useCallback(async () => {
    apiClient.get<DeployRecord[]>(`/api/projects/${projectId}/deploy-history`)
      .then((r) => setDeployHistory(r.data))
      .catch(() => setDeployHistory([]))
  }, [projectId])

  useEffect(() => {
    void load()
    loadHistory()
    apiClient.get<WorkItem[]>(`/api/work-items?projectId=${projectId}`)
      .then((r) => setAllWorkItems(r.data))
      .catch(() => setAllWorkItems([]))
  }, [load, loadHistory, projectId])

  const selectRelease = async (id: string) => {
    const r = await apiClient.get<ReleaseDetail>(`/api/releases/${id}`)
    setSelected(r.data)
  }

  const togglePlatform = (p: Platform) =>
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )

  const createRelease = async () => {
    if (!version.trim() || selectedPlatforms.length === 0) return
    await apiClient.post(`/api/projects/${projectId}/releases`, {
      version: version.trim(),
      title: title.trim() || undefined,
      platforms: selectedPlatforms,
    })
    setVersion(''); setTitle(''); setSelectedPlatforms(['WEB']); setCreating(false)
    await load()
  }

  const transition = async (status: string) => {
    if (!selected) return
    await apiClient.patch(`/api/releases/${selected.id}/status`, { status })
    await selectRelease(selected.id)
    await load()
  }

  const deploy = async () => {
    if (!selected) return
    setDeploying(true)
    try {
      await apiClient.post(`/api/releases/${selected.id}/deploy`)
      await selectRelease(selected.id)
      await load()
      await loadHistory()
    } finally {
      setDeploying(false)
    }
  }

  const rollback = async () => {
    if (!selected) return
    await apiClient.post(`/api/releases/${selected.id}/rollback`)
    await selectRelease(selected.id)
    await load()
  }

  const addWorkItem = async () => {
    if (!selected || !wiToAdd) return
    await apiClient.post(`/api/releases/${selected.id}/items`, { workItemId: wiToAdd })
    setWiToAdd(''); setAddingWI(false)
    await selectRelease(selected.id)
  }

  const removeWorkItem = async (wiId: string) => {
    if (!selected) return
    await apiClient.delete(`/api/releases/${selected.id}/items/${wiId}`)
    await selectRelease(selected.id)
  }

  const addedWIIds = new Set(selected?.releaseItems.map((ri) => ri.workItem.id) ?? [])
  const availableWIs = allWorkItems.filter((wi) => !addedWIIds.has(wi.id))

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['releases', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px ${
              tab === t ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'releases' ? <><Package size={14} /> 릴리스</> : <><History size={14} /> 배포 이력</>}
          </button>
        ))}
      </div>

      {/* ── Releases Tab ── */}
      {tab === 'releases' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Left: release list */}
          <div className="col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">릴리스 목록</h2>
              <button
                onClick={() => setCreating(!creating)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-muted"
              >
                <Plus size={12} /> 새 릴리스
              </button>
            </div>

            {creating && (
              <div className="border rounded-lg p-3 space-y-2 bg-card">
                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="버전 (예: 1.0.0)"
                  className="w-full px-2 py-1.5 text-sm border rounded bg-background"
                />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="릴리스 제목 (선택)"
                  className="w-full px-2 py-1.5 text-sm border rounded bg-background"
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">플랫폼 선택</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          selectedPlatforms.includes(p)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={createRelease}
                  disabled={!version.trim() || selectedPlatforms.length === 0}
                  className="w-full py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
                >
                  생성
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-sm text-muted-foreground">불러오는 중...</div>
            ) : releases.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">릴리스가 없습니다.</div>
            ) : (
              releases.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRelease(r.id)}
                  className={`w-full text-left border rounded-lg p-3 text-sm hover:border-primary transition-colors ${
                    selected?.id === r.id ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{r.version}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.title && <div className="text-xs text-muted-foreground">{r.title}</div>}
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{r._count.releaseItems} items</span>
                    <span>{r._count.builds} builds</span>
                    <span className="text-[10px]">{r.platforms.join(', ')}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right: release detail */}
          <div className="col-span-8">
            {!selected ? (
              <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground bg-card">
                <Package className="mx-auto mb-3 opacity-50" size={32} />
                <p>왼쪽에서 릴리스를 선택하세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header + actions */}
                <div className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{selected.version}</h2>
                      {selected.title && <div className="text-sm text-muted-foreground">{selected.title}</div>}
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${statusStyle[selected.status]}`}>
                          {selected.status}
                        </span>
                        <span className="text-muted-foreground">{selected.platforms.join(', ')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selected.status === 'DRAFT' && (
                        <Btn onClick={() => transition('TESTING')} label="테스트 시작" />
                      )}
                      {selected.status === 'TESTING' && (
                        <Btn onClick={() => transition('APPROVED')} label="승인" />
                      )}
                      {selected.status === 'APPROVED' && (
                        <Btn onClick={deploy} loading={deploying} icon={<Rocket size={12} />} label="배포" primary />
                      )}
                      {(selected.status === 'DEPLOYED' || selected.status === 'DEPLOYING') && (
                        <Btn onClick={rollback} icon={<RotateCcw size={12} />} label="롤백" danger />
                      )}
                    </div>
                  </div>
                </div>

                {/* PR linker */}
                <PrLinker
                  projectId={projectId}
                  releaseId={selected.id}
                  prNumbers={selected.prNumbers ?? []}
                  onChange={async () => { await selectRelease(selected.id) }}
                />

                {/* Work Items */}
                <div className="border rounded-lg bg-card">
                  <header className="px-4 py-2.5 border-b text-sm font-medium flex items-center justify-between">
                    <span>Work Items ({selected.releaseItems.length})</span>
                    {selected.status === 'DRAFT' && (
                      <button
                        onClick={() => setAddingWI((v) => !v)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-muted"
                      >
                        <Plus size={11} /> 추가
                      </button>
                    )}
                  </header>
                  {addingWI && selected.status === 'DRAFT' && (
                    <div className="px-4 py-3 border-b flex gap-2">
                      <select
                        value={wiToAdd}
                        onChange={(e) => setWiToAdd(e.target.value)}
                        className="flex-1 border rounded px-2 py-1.5 text-sm bg-background"
                      >
                        <option value="">Work Item 선택</option>
                        {availableWIs.map((wi) => (
                          <option key={wi.id} value={wi.id}>[{wi.type}] {wi.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={addWorkItem}
                        disabled={!wiToAdd}
                        className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
                      >
                        추가
                      </button>
                    </div>
                  )}
                  <div className="divide-y">
                    {selected.releaseItems.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground italic">포함된 Work Item이 없습니다.</div>
                    ) : (
                      selected.releaseItems.map((ri) => (
                        <div key={ri.workItem.id} className="px-4 py-2 text-sm flex items-center justify-between">
                          <div>
                            <span>{ri.workItem.title}</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted">{ri.workItem.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{ri.workItem.status}</span>
                            {selected.status === 'DRAFT' && (
                              <button
                                onClick={() => removeWorkItem(ri.workItem.id)}
                                className="text-muted-foreground hover:text-red-500"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Builds */}
                <div className="border rounded-lg bg-card">
                  <header className="px-4 py-2.5 border-b text-sm font-medium">
                    빌드 ({selected.builds.length})
                  </header>
                  <div className="divide-y">
                    {selected.builds.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground italic">아직 빌드 없음.</div>
                    ) : (
                      selected.builds.map((b) => (
                        <div key={b.id} className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {buildStatusIcon[b.status]}
                              <span className="font-medium">{b.platform}</span>
                              <span className="text-xs text-muted-foreground">{b.status}</span>
                            </div>
                            {b.cloudfrontUrl && (
                              <a
                                href={b.cloudfrontUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                다운로드 <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                          {b.buildLog && (
                            <div className="text-xs text-muted-foreground mt-1 font-mono truncate">{b.buildLog}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Deploy History Tab ── */}
      {tab === 'history' && (
        <div className="space-y-3">
          {deployHistory.length === 0 ? (
            <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground bg-card">
              <History className="mx-auto mb-3 opacity-40" size={32} />
              <p>배포 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="border rounded-lg bg-card divide-y">
              {deployHistory.map((d) => (
                <div key={d.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{d.release.version}</span>
                    {d.release.title && (
                      <span className="ml-2 text-xs text-muted-foreground">{d.release.title}</span>
                    )}
                    <span className="ml-3 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{d.platform}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {d.cloudfrontUrl && (
                      <a
                        href={d.cloudfrontUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink size={10} /> 다운로드
                      </a>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {d.completedAt
                        ? new Date(d.completedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Btn({
  onClick, label, icon, primary, danger, loading,
}: {
  onClick: () => void
  label: string
  icon?: React.ReactNode
  primary?: boolean
  danger?: boolean
  loading?: boolean
}) {
  const base = 'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium'
  const style = primary
    ? `${base} bg-primary text-primary-foreground`
    : danger
      ? `${base} bg-red-600 text-white`
      : `${base} border hover:bg-muted`
  return (
    <button onClick={onClick} disabled={loading} className={`${style} disabled:opacity-50`}>
      {icon}
      {loading ? '진행 중...' : label}
    </button>
  )
}

function PrLinker({
  projectId, releaseId, prNumbers, onChange,
}: {
  projectId: string
  releaseId: string
  prNumbers: number[]
  onChange: () => void | Promise<void>
}) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const attach = async () => {
    const n = Number(input.trim().replace(/^#/, ''))
    if (!Number.isInteger(n) || n <= 0) return
    setBusy(true)
    try { await apiClient.post(`/api/releases/${releaseId}/prs`, { prNumber: n }); setInput(''); await onChange() }
    finally { setBusy(false) }
  }

  const detach = async (n: number) => {
    setBusy(true)
    try { await apiClient.delete(`/api/releases/${releaseId}/prs/${n}`); await onChange() }
    finally { setBusy(false) }
  }

  return (
    <div className="border rounded-lg bg-card">
      <header
        className="px-4 py-2.5 text-sm font-medium flex items-center justify-between cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>연결된 PR ({prNumbers.length})</span>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </header>
      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t pt-3">
          <div className="flex flex-wrap gap-2">
            {prNumbers.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">연결된 PR이 없습니다.</span>
            ) : (
              prNumbers.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300"
                >
                  <Link href={`/projects/${projectId}/source/pr/${n}`} className="hover:underline">#{n}</Link>
                  <button onClick={() => detach(n)} disabled={busy} className="opacity-60 hover:opacity-100">×</button>
                </span>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && attach()}
              placeholder="PR 번호 (예: 42)"
              className="flex-1 px-2 py-1.5 text-sm border rounded bg-background"
            />
            <button
              onClick={attach}
              disabled={busy || !input.trim()}
              className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded disabled:opacity-50"
            >
              연결
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
