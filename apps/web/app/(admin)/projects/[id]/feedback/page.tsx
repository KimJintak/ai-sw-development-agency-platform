'use client'

import { useEffect, useState, use } from 'react'
import apiClient from '@/lib/api-client'
import { Bug, Lightbulb, HelpCircle, Wrench, Plus, X } from 'lucide-react'

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

const typeIcon: Record<FeedbackType, React.ReactNode> = {
  BUG: <Bug size={14} className="text-red-600" />,
  FEATURE: <Lightbulb size={14} className="text-blue-600" />,
  IMPROVEMENT: <Wrench size={14} className="text-amber-600" />,
  QUESTION: <HelpCircle size={14} className="text-purple-600" />,
}

const severityStyle: Record<Priority, string> = {
  P0: 'bg-red-100 text-red-700',
  P1: 'bg-orange-100 text-orange-700',
  P2: 'bg-yellow-100 text-yellow-700',
  P3: 'bg-slate-100 text-slate-700',
}

const statusStyle: Record<FeedbackStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  TRIAGED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  DUPLICATE: 'bg-slate-100 text-slate-500',
}

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const [items, setItems] = useState<Feedback[]>([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    apiClient
      .get<Feedback[]>(`/api/projects/${projectId}/feedback`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [projectId])

  const submit = async () => {
    if (!title.trim()) return
    await apiClient.post(`/api/projects/${projectId}/feedback`, {
      source: 'MANUAL',
      title: title.trim(),
      body: body.trim(),
    })
    setTitle('')
    setBody('')
    setCreating(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">피드백</h2>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded border hover:bg-muted"
        >
          {creating ? <X size={14} /> : <Plus size={14} />}
          {creating ? '취소' : '피드백 등록'}
        </button>
      </div>

      {creating && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full px-3 py-2 text-sm border rounded bg-background"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="상세 내용"
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded bg-background resize-none"
          />
          <button
            onClick={submit}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded"
          >
            제출 (자동 분류됨)
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          피드백이 없습니다.
        </div>
      ) : (
        <div className="border rounded-lg bg-card divide-y">
          {items.map((fb) => (
            <div key={fb.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
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
                  <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700">
                    WorkItem 연결됨
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {fb.source} · {new Date(fb.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {fb.body && (
                <div className="text-xs text-muted-foreground truncate">{fb.body}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
