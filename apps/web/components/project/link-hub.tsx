'use client'

import { useEffect, useState, useCallback } from 'react'
import apiClient from '@/lib/api-client'
import {
  ExternalLink,
  Plus,
  X,
  Link as LinkIcon,
  Figma,
  MonitorPlay,
  ListTree,
  FileText,
  Rocket,
  Globe,
  Book,
  GitBranch,
  HelpCircle,
  Trash2,
  Eye,
} from 'lucide-react'
import { PreviewModal } from './preview-modal'

type Category =
  | 'FIGMA'
  | 'PROTOTYPE'
  | 'WBS'
  | 'SRS'
  | 'STAGING'
  | 'PRODUCTION'
  | 'DOCS'
  | 'REPO'
  | 'QA_SHEET'
  | 'OTHER'

interface ProjectLink {
  id: string
  projectId: string
  category: Category
  label: string
  url: string
  description: string | null
  sortOrder: number
  createdAt: string
}

const categoryMeta: Record<Category, { label: string; icon: React.ReactNode; tone: string }> = {
  FIGMA:      { label: 'Figma',        icon: <Figma size={14} />,       tone: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  PROTOTYPE:  { label: '프로토타입',   icon: <MonitorPlay size={14} />, tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  WBS:        { label: 'WBS',          icon: <ListTree size={14} />,    tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  SRS:        { label: 'SRS',          icon: <FileText size={14} />,    tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  STAGING:    { label: '스테이징',     icon: <Rocket size={14} />,      tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  PRODUCTION: { label: '프로덕션',     icon: <Globe size={14} />,       tone: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  DOCS:       { label: '문서',         icon: <Book size={14} />,        tone: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  REPO:       { label: '레포',         icon: <GitBranch size={14} />,   tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  QA_SHEET:   { label: 'Q&A 시트',     icon: <HelpCircle size={14} />,  tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  OTHER:      { label: '기타',         icon: <LinkIcon size={14} />,    tone: 'bg-muted text-muted-foreground' },
}

const categoryOrder: Category[] = [
  'FIGMA',
  'PROTOTYPE',
  'WBS',
  'SRS',
  'DOCS',
  'QA_SHEET',
  'STAGING',
  'PRODUCTION',
  'REPO',
  'OTHER',
]

const EMBEDDABLE: Category[] = ['FIGMA', 'PROTOTYPE', 'STAGING', 'PRODUCTION', 'DOCS']

export function LinkHub({ projectId }: { projectId: string }) {
  const [links, setLinks] = useState<ProjectLink[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<ProjectLink | null>(null)
  const [form, setForm] = useState<{ category: Category; label: string; url: string; description: string }>({
    category: 'FIGMA',
    label: '',
    url: '',
    description: '',
  })

  const load = useCallback(() => {
    apiClient
      .get<ProjectLink[]>(`/api/projects/${projectId}/links`)
      .then((r) => setLinks(r.data))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!form.label.trim() || !form.url.trim()) return
    await apiClient.post(`/api/projects/${projectId}/links`, {
      category: form.category,
      label: form.label.trim(),
      url: form.url.trim(),
      description: form.description.trim() || undefined,
    })
    setForm({ category: 'FIGMA', label: '', url: '', description: '' })
    setAdding(false)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('이 링크를 삭제할까요?')) return
    await apiClient.delete(`/api/project-links/${id}`)
    load()
  }

  if (loading) return null

  const sorted = [...links].sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category)
    const bi = categoryOrder.indexOf(b.category)
    if (ai !== bi) return ai - bi
    return a.sortOrder - b.sortOrder
  })

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <LinkIcon size={14} className="text-primary" />
          <span className="font-semibold text-sm">외부 링크</span>
          <span className="text-xs text-muted-foreground">{links.length}</span>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted"
        >
          {adding ? <X size={12} /> : <Plus size={12} />}
          {adding ? '취소' : '추가'}
        </button>
      </header>

      {adding && (
        <div className="p-3 border-b border-border bg-muted/30 space-y-2">
          <div className="flex gap-2">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              className="px-2 py-1.5 text-sm border rounded bg-background"
            >
              {categoryOrder.map((c) => (
                <option key={c} value={c}>{categoryMeta[c].label}</option>
              ))}
            </select>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="이름 (예: Woojoo CRM Prototype)"
              className="flex-1 px-2 py-1.5 text-sm border rounded bg-background"
            />
          </div>
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
            className="w-full px-2 py-1.5 text-sm border rounded bg-background font-mono"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="메모 (선택)"
            className="w-full px-2 py-1.5 text-sm border rounded bg-background"
          />
          <button
            onClick={submit}
            disabled={!form.label.trim() || !form.url.trim()}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            저장
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground italic">
          등록된 링크가 없습니다. Figma · Prototype · WBS · 스테이징 URL 등을 추가하세요.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
          {sorted.map((link) => {
            const meta = categoryMeta[link.category] ?? categoryMeta.OTHER
            return (
              <li key={link.id} className="group">
                <div className="flex items-center gap-2 border rounded-lg p-2.5 hover:border-primary transition-colors">
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-md shrink-0 ${meta.tone}`}>
                    {meta.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium truncate hover:underline"
                      >
                        {link.label}
                      </a>
                      <ExternalLink size={10} className="text-muted-foreground shrink-0" />
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="uppercase">{meta.label}</span>
                      {link.description && (
                        <>
                          <span>·</span>
                          <span className="truncate">{link.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {EMBEDDABLE.includes(link.category) && (
                    <button
                      onClick={() => setPreview(link)}
                      className="text-muted-foreground hover:text-primary p-1"
                      title="미리보기 (iframe)"
                    >
                      <Eye size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => remove(link.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <PreviewModal
        open={preview !== null}
        url={preview?.url ?? ''}
        label={preview?.label ?? ''}
        category={preview ? categoryMeta[preview.category]?.label ?? preview.category : ''}
        onClose={() => setPreview(null)}
      />
    </section>
  )
}
