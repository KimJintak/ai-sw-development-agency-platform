'use client'

import { useEffect, useState, useCallback, use } from 'react'
import apiClient from '@/lib/api-client'
import {
  Package,
  Plus,
  Rocket,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

type ReleaseStatus = 'DRAFT' | 'TESTING' | 'APPROVED' | 'DEPLOYING' | 'DEPLOYED' | 'ROLLED_BACK'
type BuildStatus = 'PENDING' | 'BUILDING' | 'SUCCESS' | 'FAILED'

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

interface ReleaseDetail extends Omit<Release, '_count'> {
  releaseItems: { workItem: { id: string; title: string; status: string; type: string } }[]
  builds: Build[]
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
  const [releases, setReleases] = useState<Release[]>([])
  const [selected, setSelected] = useState<ReleaseDetail | null>(null)
  const [creating, setCreating] = useState(false)
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)

  const load = useCallback(async () => {
    const r = await apiClient.get<Release[]>(`/api/projects/${projectId}/releases`)
    setReleases(r.data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { void load() }, [load])

  const selectRelease = async (id: string) => {
    const r = await apiClient.get<ReleaseDetail>(`/api/releases/${id}`)
    setSelected(r.data)
  }

  const createRelease = async () => {
    if (!version.trim()) return
    await apiClient.post(`/api/projects/${projectId}/releases`, {
      version: version.trim(),
      title: title.trim() || undefined,
      platforms: ['MACOS', 'IOS'],
    })
    setVersion('')
    setTitle('')
    setCreating(false)
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

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Package size={16} /> 릴리스
          </h2>
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
            <button
              onClick={createRelease}
              className="w-full py-1.5 text-sm bg-primary text-primary-foreground rounded"
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
              <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                <span>{r._count.releaseItems} items</span>
                <span>{r._count.builds} builds</span>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="col-span-8">
        {!selected ? (
          <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground bg-card">
            <Package className="mx-auto mb-3 opacity-50" size={32} />
            <p>왼쪽에서 릴리스를 선택하세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selected.version}</h2>
                  {selected.title && (
                    <div className="text-sm text-muted-foreground">{selected.title}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusStyle[selected.status]}`}>
                      {selected.status}
                    </span>
                    <span className="text-muted-foreground">
                      {selected.platforms.join(', ')}
                    </span>
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

            <div className="border rounded-lg bg-card">
              <header className="px-4 py-2.5 border-b text-sm font-medium">
                Work Items ({selected.releaseItems.length})
              </header>
              <div className="divide-y">
                {selected.releaseItems.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground italic">
                    포함된 Work Item이 없습니다.
                  </div>
                ) : (
                  selected.releaseItems.map((ri) => (
                    <div key={ri.workItem.id} className="px-4 py-2 text-sm flex items-center justify-between">
                      <span>{ri.workItem.title}</span>
                      <span className="text-xs text-muted-foreground">{ri.workItem.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

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
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {b.buildLog}
                        </div>
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
  )
}

function Btn({
  onClick,
  label,
  icon,
  primary,
  danger,
  loading,
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
