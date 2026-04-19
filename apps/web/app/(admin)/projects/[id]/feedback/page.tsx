'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { useCurrentUser, hasRole } from '@/lib/auth/current-user-context'
import {
  Bug,
  Lightbulb,
  HelpCircle,
  Wrench,
  Plus,
  X,
  ChevronRight,
  FolderKanban,
  Globe,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react'

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

interface ProjectMeta {
  id: string
  name: string
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

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILE_COUNT = 5

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const { user } = useCurrentUser()
  const canCreate = hasRole(user, 'ADMIN', 'PM', 'CLIENT')
  const [items, setItems] = useState<Feedback[]>([])
  const [project, setProject] = useState<ProjectMeta | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    apiClient
      .get<Feedback[]>(`/api/projects/${projectId}/feedback`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    apiClient
      .get<ProjectMeta>(`/api/projects/${projectId}`)
      .then((r) => setProject(r.data))
      .catch(() => {})
  }, [projectId])

  useEffect(load, [projectId])

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const picked = Array.from(e.target.files ?? [])
    const next = [...files, ...picked]
    if (next.length > MAX_FILE_COUNT) {
      setUploadError(`최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`)
      return
    }
    const tooBig = next.find((f) => f.size > MAX_FILE_SIZE)
    if (tooBig) {
      setUploadError(`${tooBig.name}: 5MB를 초과합니다.`)
      return
    }
    setFiles(next)
    e.target.value = ''
  }

  const removeFile = (idx: number) => setFiles(files.filter((_, i) => i !== idx))

  const submit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setUploadError(null)
    try {
      const { data: fb } = await apiClient.post<{ id: string }>(
        `/api/projects/${projectId}/feedback`,
        {
          source: 'MANUAL',
          title: title.trim(),
          body: body.trim(),
        },
      )
      if (files.length > 0) {
        const payload = await Promise.all(
          files.map(async (f) => ({
            filename: f.name,
            mimeType: f.type || 'application/octet-stream',
            sizeBytes: f.size,
            dataUrl: await fileToDataUrl(f),
          })),
        )
        await apiClient.post(`/api/feedback/${fb.id}/attachments`, { files: payload })
      }
      setTitle('')
      setBody('')
      setFiles([])
      setCreating(false)
      load()
    } catch (e) {
      setUploadError((e as Error).message || '제출에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground">
          Projects
        </Link>
        <ChevronRight size={12} />
        <Link href={`/projects/${projectId}`} className="hover:text-foreground">
          {project?.name ?? '프로젝트'}
        </Link>
        <ChevronRight size={12} />
        <span className="text-foreground">피드백</span>
      </nav>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <FolderKanban size={16} className="text-primary shrink-0" />
            <span className="truncate">{project?.name ?? '프로젝트'}</span>
            <span className="text-sm font-normal text-muted-foreground">· 피드백</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            이 프로젝트에 등록된 피드백만 표시합니다.
            <Link
              href="/feedback"
              className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Globe size={10} />
              전체 피드백 보기
            </Link>
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setCreating(!creating)}
            className="shrink-0 flex items-center gap-1 text-sm px-3 py-1.5 rounded border hover:bg-muted"
          >
            {creating ? <X size={14} /> : <Plus size={14} />}
            {creating ? '취소' : '피드백 등록'}
          </button>
        )}
      </div>

      {canCreate && creating && (
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

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border hover:bg-muted cursor-pointer">
              <Paperclip size={12} />
              파일 추가
              <input
                type="file"
                multiple
                className="hidden"
                onChange={onPickFiles}
                accept="image/*,.pdf,.txt,.log,.json,.csv,.zip"
              />
            </label>
            <span className="ml-2 text-xs text-muted-foreground">
              파일당 5MB · 최대 {MAX_FILE_COUNT}개
            </span>
            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1"
                  >
                    {f.type.startsWith('image/') ? (
                      <ImageIcon size={12} className="text-primary" />
                    ) : (
                      <FileIcon size={12} className="text-muted-foreground" />
                    )}
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-muted-foreground shrink-0">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-destructive"
                      title="제거"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {uploadError && (
              <div className="text-xs text-destructive">{uploadError}</div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            {submitting ? '제출 중...' : '제출 (자동 분류됨)'}
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
            <Link
              key={fb.id}
              href={`/projects/${projectId}/feedback/${fb.id}`}
              className="block px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  {fb.source} · {new Date(fb.createdAt).toLocaleDateString('ko-KR')}
                  <ChevronRight size={12} />
                </span>
              </div>
              {fb.body && (
                <div className="text-xs text-muted-foreground truncate">{fb.body}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
