'use client'

import { useEffect, useState, use, useCallback } from 'react'
import apiClient from '@/lib/api-client'
import {
  HelpCircle,
  Plus,
  X,
  Check,
  MessageSquare,
  Clock,
  Archive,
  CheckCircle2,
  Trash2,
  ChevronDown,
} from 'lucide-react'

type Status = 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'PARKED'
type Priority = 'P0' | 'P1' | 'P2' | 'P3'

interface Qna {
  id: string
  projectId: string
  question: string
  answer: string | null
  status: Status
  priority: Priority
  askedBy: string | null
  askedByName: string | null
  answeredBy: string | null
  answeredByName: string | null
  answeredAt: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

const statusMeta: Record<Status, { label: string; tone: string; icon: React.ReactNode }> = {
  OPEN:     { label: '답변 대기', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',     icon: <Clock size={11} /> },
  ANSWERED: { label: '답변 완료', tone: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',       icon: <MessageSquare size={11} /> },
  RESOLVED: { label: '해결됨',    tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 size={11} /> },
  PARKED:   { label: '보류',      tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',     icon: <Archive size={11} /> },
}

const priorityTone: Record<Priority, string> = {
  P0: 'bg-red-500/10 text-red-700 dark:text-red-400',
  P1: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  P2: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  P3: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
}

export default function QnaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const [items, setItems] = useState<Qna[]>([])
  const [adding, setAdding] = useState(false)
  const [question, setQuestion] = useState('')
  const [priority, setPriority] = useState<Priority>('P2')
  const [answering, setAnswering] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    apiClient
      .get<Qna[]>(`/api/projects/${projectId}/qna`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!question.trim()) return
    await apiClient.post(`/api/projects/${projectId}/qna`, { question: question.trim(), priority })
    setQuestion('')
    setPriority('P2')
    setAdding(false)
    load()
  }

  const submitAnswer = async (id: string) => {
    if (!answerText.trim()) return
    await apiClient.post(`/api/project-qna/${id}/answer`, { answer: answerText.trim() })
    setAnswerText('')
    setAnswering(null)
    load()
  }

  const updateStatus = async (id: string, status: Status) => {
    await apiClient.patch(`/api/project-qna/${id}/status`, { status })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('이 Q&A를 삭제할까요?')) return
    await apiClient.delete(`/api/project-qna/${id}`)
    load()
  }

  const filtered = filter === 'ALL' ? items : items.filter((q) => q.status === filter)
  const counts: Record<Status | 'ALL', number> = {
    ALL: items.length,
    OPEN: items.filter((q) => q.status === 'OPEN').length,
    ANSWERED: items.filter((q) => q.status === 'ANSWERED').length,
    RESOLVED: items.filter((q) => q.status === 'RESOLVED').length,
    PARKED: items.filter((q) => q.status === 'PARKED').length,
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <HelpCircle size={18} className="text-rose-600" />
            Q&A
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            고객사·개발팀 간 질문·답변을 이 프로젝트에 페어로 추적합니다.
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border hover:bg-muted"
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
          {adding ? '취소' : '질문 등록'}
        </button>
      </header>

      {adding && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="질문 내용을 자세히 작성해주세요..."
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded bg-background resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">우선순위:</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="px-2 py-1 text-xs border rounded bg-background"
            >
              {(['P0', 'P1', 'P2', 'P3'] as Priority[]).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={submit}
              disabled={!question.trim()}
              className="ml-auto px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
            >
              제출
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {(['ALL', 'OPEN', 'ANSWERED', 'RESOLVED', 'PARKED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              filter === s
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'ALL' ? '전체' : statusMeta[s].label}
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted">
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-8">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <HelpCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">등록된 Q&A가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((q) => {
            const meta = statusMeta[q.status]
            return (
              <li key={q.id} className="border rounded-lg bg-card overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium ${meta.tone}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityTone[q.priority]}`}>
                      {q.priority}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {q.askedByName ?? '—'} · {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <button
                      onClick={() => remove(q.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="text-sm whitespace-pre-wrap font-medium">
                    {q.question}
                  </div>
                </div>

                {q.answer ? (
                  <div className="border-t bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                      <Check size={11} className="text-blue-600" />
                      <span className="font-medium text-foreground">{q.answeredByName ?? '답변자'}</span>
                      <span>·</span>
                      <span>{q.answeredAt ? new Date(q.answeredAt).toLocaleDateString('ko-KR') : '—'}</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{q.answer}</div>
                  </div>
                ) : answering === q.id ? (
                  <div className="border-t bg-muted/30 p-3 space-y-2">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="답변 내용..."
                      rows={3}
                      autoFocus
                      className="w-full px-3 py-2 text-sm border rounded bg-background resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitAnswer(q.id)}
                        disabled={!answerText.trim()}
                        className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
                      >
                        답변 제출
                      </button>
                      <button
                        onClick={() => { setAnswering(null); setAnswerText('') }}
                        className="px-3 py-1.5 text-sm border rounded"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t px-4 py-2.5 flex items-center gap-2">
                    <button
                      onClick={() => { setAnswering(q.id); setAnswerText('') }}
                      className="text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:opacity-90"
                    >
                      답변 작성
                    </button>
                    <div className="ml-auto">
                      <StatusMenu value={q.status} onChange={(s) => updateStatus(q.id, s)} />
                    </div>
                  </div>
                )}
                {q.answer && q.status !== 'RESOLVED' && (
                  <div className="border-t px-4 py-2 flex justify-end">
                    <StatusMenu value={q.status} onChange={(s) => updateStatus(q.id, s)} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StatusMenu({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Status)}
        className="text-xs pl-2 pr-6 py-1 rounded border bg-background appearance-none"
      >
        <option value="OPEN">답변 대기</option>
        <option value="ANSWERED">답변 완료</option>
        <option value="RESOLVED">해결됨</option>
        <option value="PARKED">보류</option>
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
    </div>
  )
}
