'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Paperclip,
  Download,
  Trash2,
  Edit3,
  Save,
  X,
  Image as ImageIcon,
  File as FileIcon,
  Calendar,
  User,
} from 'lucide-react'
import apiClient from '@/lib/api-client'
import { useCurrentUser, hasRole } from '@/lib/auth/current-user-context'

type Category = 'CLIENT' | 'INTERNAL'
type Kind = 'SPEC' | 'CONTRACT' | 'REFERENCE' | 'API_DOC' | 'MANUAL' | 'DEPLOY_GUIDE' | 'OTHER'

interface Attachment {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

interface Doc {
  id: string
  projectId: string
  title: string
  category: Category
  kind: Kind
  body: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
  attachments: Attachment[]
}

const KIND_LABEL: Record<Kind, string> = {
  SPEC: '요구사항',
  CONTRACT: '계약서',
  REFERENCE: '참고자료',
  API_DOC: 'API 문서',
  MANUAL: '매뉴얼',
  DEPLOY_GUIDE: '배포/운영',
  OTHER: '기타',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILE_COUNT = 10

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>
}) {
  const { id: projectId, docId } = use(params)
  const { user } = useCurrentUser()
  const canManage = hasRole(user, 'ADMIN', 'PM')

  const [doc, setDoc] = useState<Doc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [eTitle, setETitle] = useState('')
  const [eBody, setEBody] = useState('')
  const [eKind, setEKind] = useState<Kind>('OTHER')
  const [busy, setBusy] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get<Doc>(`/api/documents/${docId}`)
      setDoc(data)
      setETitle(data.title)
      setEBody(data.body)
      setEKind(data.kind)
    } catch (e) {
      setError((e as Error).message || '문서를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [docId])

  useEffect(() => {
    load()
  }, [load])

  const saveEdit = async () => {
    if (!doc || busy) return
    setBusy(true)
    try {
      await apiClient.patch(`/api/documents/${docId}`, {
        title: eTitle.trim(),
        body: eBody,
        kind: eKind,
      })
      setEditing(false)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm('이 문서를 삭제할까요?')) return
    await apiClient.delete(`/api/documents/${docId}`)
    window.location.href = `/projects/${projectId}/documents`
  }

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadErr(null)
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (files.length > MAX_FILE_COUNT) {
      setUploadErr(`최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`)
      return
    }
    const tooBig = files.find((f) => f.size > MAX_FILE_SIZE)
    if (tooBig) {
      setUploadErr(`${tooBig.name}: 10MB를 초과합니다.`)
      return
    }
    e.target.value = ''
    setUploading(true)
    try {
      const payload = await Promise.all(
        files.map(async (f) => ({
          filename: f.name,
          mimeType: f.type || 'application/octet-stream',
          sizeBytes: f.size,
          dataUrl: await fileToDataUrl(f),
        })),
      )
      await apiClient.post(`/api/documents/${docId}/attachments`, { files: payload })
      await load()
    } catch (err) {
      setUploadErr((err as Error).message || '업로드 실패')
    } finally {
      setUploading(false)
    }
  }

  const deleteAttachment = async (attId: string) => {
    if (!confirm('첨부를 삭제할까요?')) return
    await apiClient.delete(`/api/document-attachments/${attId}`)
    await load()
  }

  if (loading) return <div className="text-sm text-muted-foreground">불러오는 중...</div>
  if (error) return <div className="text-sm text-destructive">{error}</div>
  if (!doc) return null

  const downloadUrl = (id: string) => `/api/document-attachments/${id}`

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href={`/projects/${projectId}/documents`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        문서 목록
      </Link>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={eTitle}
                onChange={(e) => setETitle(e.target.value)}
                className="w-full text-xl font-bold px-2 py-1 border rounded bg-background"
              />
            ) : (
              <h1 className="text-xl font-bold">{doc.title}</h1>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-muted font-medium">
                {doc.category === 'CLIENT' ? '고객사 자료' : '개발 산출물'}
              </span>
              {editing ? (
                <select
                  value={eKind}
                  onChange={(e) => setEKind(e.target.value as Kind)}
                  className="px-2 py-0.5 border rounded bg-background text-xs"
                >
                  {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {KIND_LABEL[doc.kind]}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar size={10} />
                {new Date(doc.updatedAt).toLocaleString('ko-KR')}
              </span>
              {doc.createdBy && (
                <span className="inline-flex items-center gap-1">
                  <User size={10} />
                  {doc.createdBy}
                </span>
              )}
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 shrink-0">
              {editing ? (
                <>
                  <button
                    onClick={saveEdit}
                    disabled={busy}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    <Save size={12} />
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setETitle(doc.title)
                      setEBody(doc.body)
                      setEKind(doc.kind)
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border hover:bg-muted"
                  >
                    <X size={12} />
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border hover:bg-muted"
                  >
                    <Edit3 size={12} />
                    편집
                  </button>
                  <button
                    onClick={remove}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={12} />
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <textarea
            value={eBody}
            onChange={(e) => setEBody(e.target.value)}
            rows={18}
            className="w-full px-3 py-2 text-sm border rounded bg-background font-mono leading-relaxed"
          />
        ) : doc.body ? (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans pt-3 border-t">
            {doc.body}
          </pre>
        ) : (
          <div className="text-sm text-muted-foreground italic pt-3 border-t">
            본문이 비어 있습니다.
          </div>
        )}
      </div>

      <section className="rounded-lg border bg-card">
        <header className="px-4 py-3 border-b flex items-center gap-2">
          <Paperclip size={15} className="text-primary" />
          <h2 className="font-semibold text-sm">첨부 파일</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {doc.attachments.length}개
          </span>
          {canManage && (
            <label className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border bg-background hover:bg-muted cursor-pointer">
              <Paperclip size={12} />
              {uploading ? '업로드 중...' : '파일 추가'}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={onPickFiles}
                disabled={uploading}
              />
            </label>
          )}
        </header>
        {uploadErr && (
          <div className="px-4 py-2 text-xs text-destructive border-b">{uploadErr}</div>
        )}
        <div className="p-4">
          {doc.attachments.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">첨부가 없습니다.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {doc.attachments.map((a) => {
                const isImage = a.mimeType.startsWith('image/')
                return (
                  <div
                    key={a.id}
                    className="border rounded-md overflow-hidden bg-muted/20 group"
                  >
                    {isImage ? (
                      <a href={downloadUrl(a.id)} target="_blank" rel="noreferrer">
                        <img
                          src={downloadUrl(a.id)}
                          alt={a.filename}
                          className="w-full h-32 object-cover"
                        />
                      </a>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-muted-foreground">
                        <FileIcon size={32} />
                      </div>
                    )}
                    <div className="p-2 flex items-center gap-2 text-xs border-t bg-background">
                      {isImage ? (
                        <ImageIcon size={12} className="text-primary shrink-0" />
                      ) : (
                        <FileIcon size={12} className="text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate flex-1" title={a.filename}>
                        {a.filename}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {(a.sizeBytes / 1024).toFixed(0)} KB
                      </span>
                      <a
                        href={downloadUrl(a.id)}
                        download={a.filename}
                        className="text-muted-foreground hover:text-primary"
                        title="다운로드"
                      >
                        <Download size={12} />
                      </a>
                      {canManage && (
                        <button
                          onClick={() => deleteAttachment(a.id)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          title="삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
