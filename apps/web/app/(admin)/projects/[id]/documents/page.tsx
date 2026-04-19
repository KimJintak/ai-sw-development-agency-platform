'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Building2,
  Wrench,
  Plus,
  X,
  Paperclip,
  Calendar,
  User,
  BookOpen,
  FileCode2,
  Download,
  File as FileIcon,
} from 'lucide-react'
import apiClient from '@/lib/api-client'
import { useCurrentUser, hasRole } from '@/lib/auth/current-user-context'

type Category = 'CLIENT' | 'INTERNAL'
type Kind = 'SPEC' | 'CONTRACT' | 'REFERENCE' | 'API_DOC' | 'MANUAL' | 'DEPLOY_GUIDE' | 'OTHER'

interface DocListItem {
  id: string
  title: string
  category: Category
  kind: Kind
  createdBy: string | null
  createdAt: string
  updatedAt: string
  _count: { attachments: number }
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

const KIND_ICON: Record<Kind, React.ReactNode> = {
  SPEC: <FileText size={14} />,
  CONTRACT: <FileIcon size={14} />,
  REFERENCE: <BookOpen size={14} />,
  API_DOC: <FileCode2 size={14} />,
  MANUAL: <BookOpen size={14} />,
  DEPLOY_GUIDE: <Wrench size={14} />,
  OTHER: <FileIcon size={14} />,
}

const CATEGORY_META: Record<Category, {
  label: string
  desc: string
  icon: React.ReactNode
  cls: string
}> = {
  CLIENT: {
    label: '고객사 자료',
    desc: '고객이 제공한 요구사항·계약서·참고자료 등',
    icon: <Building2 size={16} />,
    cls: 'border-sky-200 bg-sky-50/40 dark:bg-sky-500/5 dark:border-sky-500/30',
  },
  INTERNAL: {
    label: '개발 산출물',
    desc: 'API 문서·매뉴얼·배포 가이드 등 우리 팀이 생성하는 문서',
    icon: <Wrench size={16} />,
    cls: 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-500/5 dark:border-emerald-500/30',
  },
}

export default function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const { user } = useCurrentUser()
  const canManage = hasRole(user, 'ADMIN', 'PM')

  const [docs, setDocs] = useState<DocListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<Category | null>(null)

  const [nTitle, setNTitle] = useState('')
  const [nBody, setNBody] = useState('')
  const [nKind, setNKind] = useState<Kind>('OTHER')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get<DocListItem[]>(
        `/api/projects/${projectId}/documents`,
      )
      setDocs(data)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = (cat: Category) => {
    setCreating(cat)
    setNTitle('')
    setNBody('')
    setNKind(cat === 'CLIENT' ? 'SPEC' : 'API_DOC')
    setErr(null)
  }

  const submitCreate = async () => {
    if (!creating || !nTitle.trim() || submitting) return
    setSubmitting(true)
    setErr(null)
    try {
      await apiClient.post(`/api/projects/${projectId}/documents`, {
        title: nTitle.trim(),
        category: creating,
        kind: nKind,
        body: nBody.trim(),
      })
      setCreating(null)
      await load()
    } catch (e) {
      setErr((e as Error).message || '문서 생성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const byCategory = (c: Category) => docs.filter((d) => d.category === c)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">문서</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          고객사로부터 받은 자료와 개발 완료 시 산출하는 API·매뉴얼 문서를 프로젝트별로 관리합니다.
        </p>
      </div>

      {(['CLIENT', 'INTERNAL'] as Category[]).map((cat) => {
        const meta = CATEGORY_META[cat]
        const list = byCategory(cat)
        const isCreating = creating === cat
        return (
          <section key={cat} className={`rounded-lg border ${meta.cls}`}>
            <header className="flex items-center gap-3 px-4 py-3 border-b border-inherit">
              <span className="text-primary">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{meta.label}</h3>
                <p className="text-xs text-muted-foreground">{meta.desc}</p>
              </div>
              <span className="text-xs text-muted-foreground">{list.length}건</span>
              {canManage && (
                <button
                  onClick={() => (isCreating ? setCreating(null) : openCreate(cat))}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border bg-background hover:bg-muted"
                >
                  {isCreating ? <X size={12} /> : <Plus size={12} />}
                  {isCreating ? '취소' : '추가'}
                </button>
              )}
            </header>

            {isCreating && canManage && (
              <div className="p-4 border-b border-inherit bg-background/60 space-y-3">
                <input
                  value={nTitle}
                  onChange={(e) => setNTitle(e.target.value)}
                  placeholder="문서 제목"
                  className="w-full px-3 py-2 text-sm border rounded bg-background"
                />
                <select
                  value={nKind}
                  onChange={(e) => setNKind(e.target.value as Kind)}
                  className="px-3 py-2 text-sm border rounded bg-background"
                >
                  {(cat === 'CLIENT'
                    ? (['SPEC', 'CONTRACT', 'REFERENCE', 'OTHER'] as Kind[])
                    : (['API_DOC', 'MANUAL', 'DEPLOY_GUIDE', 'OTHER'] as Kind[])
                  ).map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
                <textarea
                  value={nBody}
                  onChange={(e) => setNBody(e.target.value)}
                  placeholder="본문 (Markdown 가능)"
                  rows={6}
                  className="w-full px-3 py-2 text-sm border rounded bg-background font-mono"
                />
                {err && <div className="text-xs text-destructive">{err}</div>}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={submitCreate}
                    disabled={submitting}
                    className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
                  >
                    {submitting ? '생성 중...' : '생성'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  생성 후 상세 페이지에서 파일을 첨부할 수 있습니다.
                </p>
              </div>
            )}

            <div className="divide-y divide-inherit">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">불러오는 중...</div>
              ) : list.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  {cat === 'CLIENT' ? '등록된 고객 자료가 없습니다.' : '아직 산출물이 없습니다.'}
                </div>
              ) : (
                list.map((d) => (
                  <Link
                    key={d.id}
                    href={`/projects/${projectId}/documents/${d.id}`}
                    className="block px-4 py-3 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-primary">{KIND_ICON[d.kind]}</span>
                      <span className="font-medium text-sm">{d.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {KIND_LABEL[d.kind]}
                      </span>
                      {d._count.attachments > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary inline-flex items-center gap-1">
                          <Paperclip size={10} />
                          {d._count.attachments}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(d.updatedAt).toLocaleDateString('ko-KR')}
                      </span>
                      {d.createdBy && (
                        <span className="inline-flex items-center gap-1">
                          <User size={10} />
                          {d.createdBy}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
