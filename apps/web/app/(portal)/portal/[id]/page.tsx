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
  HelpCircle,
  Clock,
  MessageSquare,
  Archive,
  Plus,
  X,
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

interface QnaItem {
  id: string
  question: string
  answer: string | null
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'PARKED'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  askedByName: string | null
  answeredByName: string | null
  answeredAt: string | null
  tags: string[]
  createdAt: string
}

export default function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [builds, setBuilds] = useState<Build[]>([])
  const [qnas, setQnas] = useState<QnaItem[]>([])
  const [tab, setTab] = useState<'overview' | 'requirements' | 'builds' | 'qna' | 'report'>('overview')
  const [askOpen, setAskOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newPriority, setNewPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2')

  const loadQnas = () => {
    apiClient.get<QnaItem[]>(`/api/portal/projects/${id}/qna`).then((r) => setQnas(r.data)).catch(() => setQnas([]))
  }

  useEffect(() => {
    apiClient.get<Progress>(`/api/portal/projects/${id}/progress`).then((r) => setProgress(r.data))
    apiClient.get<Requirement[]>(`/api/portal/projects/${id}/requirements`).then((r) => setRequirements(r.data))
    apiClient.get<Build[]>(`/api/portal/projects/${id}/builds`).then((r) => setBuilds(r.data))
    loadQnas()
  }, [id])

  const submitQuestion = async () => {
    if (!newQuestion.trim()) return
    try {
      await apiClient.post(`/api/portal/projects/${id}/qna`, {
        question: newQuestion.trim(),
        priority: newPriority,
      })
      setNewQuestion('')
      setNewPriority('P2')
      setAskOpen(false)
      loadQnas()
    } catch {
      alert('질문 등록에 실패했습니다.')
    }
  }

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

  const openQnas = qnas.filter((q) => q.status === 'OPEN').length

  const tabs = [
    { key: 'overview' as const, label: '개요', icon: <BarChart3 size={14} /> },
    { key: 'requirements' as const, label: '요구사항', icon: <FileText size={14} /> },
    { key: 'builds' as const, label: '빌드 다운로드', icon: <Download size={14} /> },
    { key: 'qna' as const, label: 'Q&A', icon: <HelpCircle size={14} />, badge: openQnas },
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
            {'badge' in t && typeof t.badge === 'number' && t.badge > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                {t.badge}
              </span>
            )}
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

      {tab === 'qna' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {qnas.length === 0
                ? '아직 Q&A가 없습니다. 첫 질문을 남겨보세요.'
                : `전체 ${qnas.length}건 · 답변 대기 ${openQnas}건`}
            </div>
            <button
              onClick={() => setAskOpen(!askOpen)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded border hover:bg-muted"
            >
              {askOpen ? <X size={14} /> : <Plus size={14} />}
              {askOpen ? '취소' : '질문 등록'}
            </button>
          </div>

          {askOpen && (
            <div className="border rounded-lg p-4 bg-card space-y-3">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows={4}
                placeholder="질문 내용을 입력하세요..."
                className="w-full px-3 py-2 text-sm border rounded bg-background resize-none"
              />
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground">우선순위:</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'P0' | 'P1' | 'P2' | 'P3')}
                  className="px-2 py-1 text-xs border rounded bg-background"
                >
                  {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  onClick={submitQuestion}
                  disabled={!newQuestion.trim()}
                  className="ml-auto px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
                >
                  제출
                </button>
              </div>
            </div>
          )}

          {qnas.length === 0 ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              <HelpCircle size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">등록된 Q&A가 없습니다.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {qnas.map((q) => (
                <QnaCard key={q.id} q={q} />
              ))}
            </ul>
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
          <div className="flex gap-3 justify-center">
            <button
              onClick={downloadReport}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted"
            >
              JSON 다운로드
            </button>
            <a
              href={`/api/portal/projects/${id}/report/pdf`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium inline-flex items-center gap-1"
            >
              <Download size={14} /> PDF 다운로드
            </a>
          </div>
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

function QnaCard({ q }: { q: QnaItem }) {
  const statusMeta: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
    OPEN:     { label: '답변 대기', tone: 'bg-amber-100 text-amber-700',   icon: <Clock size={11} /> },
    ANSWERED: { label: '답변 완료', tone: 'bg-blue-100 text-blue-700',     icon: <MessageSquare size={11} /> },
    RESOLVED: { label: '해결됨',    tone: 'bg-green-100 text-green-700',   icon: <CheckCircle2 size={11} /> },
    PARKED:   { label: '보류',      tone: 'bg-slate-100 text-slate-600',   icon: <Archive size={11} /> },
  }
  const priorityTone: Record<string, string> = {
    P0: 'bg-red-100 text-red-700',
    P1: 'bg-orange-100 text-orange-700',
    P2: 'bg-yellow-100 text-yellow-700',
    P3: 'bg-slate-100 text-slate-600',
  }
  const sm = statusMeta[q.status]
  return (
    <li className="border rounded-lg bg-card overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium ${sm.tone}`}>
            {sm.icon}
            {sm.label}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityTone[q.priority] ?? 'bg-muted'}`}>
            {q.priority}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {q.askedByName ?? '—'} · {new Date(q.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
        <div className="text-sm whitespace-pre-wrap font-medium">{q.question}</div>
      </div>
      {q.answer && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <CheckCircle2 size={11} className="text-blue-600" />
            <span className="font-medium text-foreground">{q.answeredByName ?? '답변자'}</span>
            {q.answeredAt && (
              <>
                <span>·</span>
                <span>{new Date(q.answeredAt).toLocaleDateString('ko-KR')}</span>
              </>
            )}
          </div>
          <div className="text-sm whitespace-pre-wrap">{q.answer}</div>
        </div>
      )}
    </li>
  )
}
