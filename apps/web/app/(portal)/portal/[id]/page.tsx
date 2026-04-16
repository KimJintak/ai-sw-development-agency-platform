'use client'

import { useEffect, useState, use } from 'react'
import apiClient from '@/lib/api-client'
import {
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Package,
  BarChart3,
  ExternalLink,
} from 'lucide-react'

interface Progress {
  projectId: string
  name: string
  status: string
  platforms: string[]
  progress: number
  workItemStats: { total: number; done: number; inProgress: number }
  recentReleases: { id: string; version: string; status: string; deployedAt: string | null; platforms: string[] }[]
}

interface Requirement {
  id: string
  title: string
  status: string
  version: number
  platforms: string[]
  updatedAt: string
}

interface Build {
  id: string
  platform: string
  status: string
  cloudfrontUrl: string | null
  completedAt: string | null
  release: { version: string }
}

export default function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [builds, setBuilds] = useState<Build[]>([])
  const [tab, setTab] = useState<'overview' | 'requirements' | 'builds' | 'report'>('overview')

  useEffect(() => {
    apiClient.get<Progress>(`/api/portal/projects/${id}/progress`).then((r) => setProgress(r.data))
    apiClient.get<Requirement[]>(`/api/portal/projects/${id}/requirements`).then((r) => setRequirements(r.data))
    apiClient.get<Build[]>(`/api/portal/projects/${id}/builds`).then((r) => setBuilds(r.data))
  }, [id])

  const approve = async (reqId: string) => {
    await apiClient.post(`/api/portal/requirements/${reqId}/approve`)
    setRequirements((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: 'APPROVED' } : r)))
  }

  const reject = async (reqId: string) => {
    await apiClient.post(`/api/portal/requirements/${reqId}/reject`, { reason: '고객 반려' })
    setRequirements((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: 'REJECTED' } : r)))
  }

  const downloadReport = async () => {
    const res = await apiClient.get(`/api/portal/projects/${id}/report`)
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `delivery-report-${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { key: 'overview' as const, label: '개요', icon: <BarChart3 size={14} /> },
    { key: 'requirements' as const, label: '요구사항', icon: <FileText size={14} /> },
    { key: 'builds' as const, label: '빌드 다운로드', icon: <Download size={14} /> },
    { key: 'report' as const, label: '납품 보고서', icon: <Package size={14} /> },
  ]

  return (
    <div className="space-y-6">
      {progress && (
        <header>
          <h1 className="text-2xl font-bold">{progress.name}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {progress.platforms.join(', ')} · {progress.status}
          </div>
        </header>
      )}

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px ${
              tab === t.key
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && progress && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">진척률</span>
              <span className="text-2xl font-bold text-primary">{progress.progress}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progress.progress}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
              <div>
                <div className="text-2xl font-bold">{progress.workItemStats.total}</div>
                <div className="text-xs text-muted-foreground">전체</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{progress.workItemStats.done}</div>
                <div className="text-xs text-muted-foreground">완료</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{progress.workItemStats.inProgress}</div>
                <div className="text-xs text-muted-foreground">진행 중</div>
              </div>
            </div>
          </div>
          {progress.recentReleases.length > 0 && (
            <div className="border rounded-lg bg-card">
              <header className="px-4 py-2.5 border-b text-sm font-medium">최근 릴리스</header>
              <div className="divide-y">
                {progress.recentReleases.map((r) => (
                  <div key={r.id} className="px-4 py-2 text-sm flex justify-between">
                    <span className="font-medium">{r.version}</span>
                    <span className="text-xs text-muted-foreground">{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'requirements' && (
        <div className="border rounded-lg bg-card divide-y">
          {requirements.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">요구사항이 없습니다.</div>
          ) : (
            requirements.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    v{r.version} · {r.platforms.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => approve(r.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        <CheckCircle2 size={12} /> 승인
                      </button>
                      <button
                        onClick={() => reject(r.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <XCircle size={12} /> 반려
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'builds' && (
        <div className="border rounded-lg bg-card divide-y">
          {builds.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">다운로드 가능한 빌드가 없습니다.</div>
          ) : (
            builds.map((b) => (
              <div key={b.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{b.release.version}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span>{b.platform}</span>
                </div>
                {b.cloudfrontUrl && (
                  <a
                    href={b.cloudfrontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    <Download size={12} /> 다운로드 <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'report' && (
        <div className="border rounded-lg p-6 bg-card text-center">
          <Package className="mx-auto mb-3 text-primary" size={32} />
          <h2 className="font-semibold mb-2">납품 보고서</h2>
          <p className="text-sm text-muted-foreground mb-4">
            프로젝트 진척 요약, 요구사항, 릴리스, 테스트 결과, 빌드 목록이 포함된 보고서를 생성합니다.
          </p>
          <button
            onClick={downloadReport}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            보고서 다운로드 (JSON)
          </button>
          <p className="text-xs text-muted-foreground mt-2">PDF 형식은 후속 업데이트에서 지원 예정</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    SUPERSEDED: 'bg-slate-100 text-slate-500',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-muted'}`}>
      {status}
    </span>
  )
}
