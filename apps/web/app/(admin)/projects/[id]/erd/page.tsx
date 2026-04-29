'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { MermaidViewer } from '@/components/design/mermaid-viewer'
import { Database, Plus, Sparkles, Loader2, Pencil, Check, X } from 'lucide-react'

interface ErdArtifact {
  id: string
  title: string
  mermaidCode: string | null
  version: number
  updatedAt: string
  _count?: { versions: number }
}

const DEFAULT_ERD = `erDiagram
  USER {
    string id PK
    string email
    string name
  }
  PROJECT {
    string id PK
    string name
    string status
  }
  USER ||--o{ PROJECT : owns
`

export default function ErdPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [items, setItems] = useState<ErdArtifact[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [code, setCode] = useState(DEFAULT_ERD)
  const [submitting, setSubmitting] = useState(false)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [theme, setTheme] = useState<'default' | 'dark' | 'forest' | 'neutral'>('default')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const load = () =>
    apiClient.get<ErdArtifact[]>(`/api/design?projectId=${projectId}&type=ERD`)
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))

  useEffect(() => { load() }, [projectId])
  useEffect(() => {
    if (showForm) setTimeout(() => titleRef.current?.focus(), 50)
  }, [showForm])

  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null

  const submit = async () => {
    if (!title.trim()) { setErrorMsg('ERD 제목을 입력해주세요.'); return }
    if (!code.trim()) { setErrorMsg('Mermaid 코드를 입력해주세요.'); return }
    setErrorMsg(null)
    setSubmitting(true)
    try {
      await apiClient.post('/api/design', { projectId, type: 'ERD', title, mermaidCode: code })
      setTitle('')
      setCode(DEFAULT_ERD)
      setShowForm(false)
      setSuccessMsg('ERD가 저장되었습니다.')
      setTimeout(() => setSuccessMsg(null), 3000)
      load()
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      setErrorMsg(msg ?? '저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const saveEdit = async () => {
    if (!selected || editingCode === null) return
    setErrorMsg(null)
    setSavingEdit(true)
    try {
      await apiClient.patch(`/api/design/${selected.id}`, { mermaidCode: editingCode })
      setEditingCode(null)
      setSuccessMsg('새 버전으로 저장되었습니다.')
      setTimeout(() => setSuccessMsg(null), 3000)
      load()
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      setErrorMsg(msg ?? '저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSavingEdit(false)
    }
  }

  const generateErd = async () => {
    setGenerating(true)
    try {
      const res = await apiClient.post<{ mermaidCode: string }>(`/api/projects/${projectId}/scm/generate-erd`)
      setCode(res.data.mermaidCode)
      setShowForm(true)
      setTitle('AI 생성 ERD')
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      alert(msg ?? 'ERD 생성에 실패했습니다. githubRepo가 설정되어 있는지 확인하세요.')
    } finally {
      setGenerating(false)
    }
  }

  const displayCode = editingCode !== null ? editingCode : (selected?.mermaidCode ?? '')

  return (
    <div className="space-y-5">
      {errorMsg && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="shrink-0 hover:opacity-70">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <span>{successMsg}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold">DB ERD</h2>
          <Link href={`/projects/${projectId}/design`} className="text-xs text-muted-foreground hover:underline ml-2">
            → Design Hub에서 전체 보기
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}
            className="text-xs border rounded-md px-2 py-1.5 bg-background">
            {['default', 'dark', 'forest', 'neutral'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button onClick={generateErd} disabled={generating}
            className="inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 hover:bg-muted disabled:opacity-60">
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} className="text-violet-500" />}
            {generating ? 'AI 생성 중...' : 'AI로 생성'}
          </button>
          <button onClick={() => { setShowForm((v) => !v); setCode(DEFAULT_ERD); setTitle('') }}
            className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground rounded-md px-3 py-1.5 hover:opacity-90">
            <Plus size={13} />
            새 ERD
          </button>
        </div>
      </div>

      {showForm && (
        <div className="border rounded-xl p-5 space-y-3 bg-card">
          <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="ERD 제목 (예: 사용자·프로젝트 도메인)"
            autoFocus
            className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
          <div className="grid lg:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Mermaid ERD 코드</p>
              <textarea value={code} onChange={(e) => setCode(e.target.value)}
                rows={14} spellCheck={false}
                className="w-full border rounded-md px-3 py-2 text-xs font-mono bg-background resize-none" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">미리보기</p>
              {code.trim() ? <MermaidViewer code={code} theme={theme} /> : (
                <div className="border rounded-md p-4 text-xs text-muted-foreground h-full flex items-center justify-center">
                  코드를 입력하면 미리보기가 표시됩니다.
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-sm border rounded-md px-4 py-2 hover:bg-muted">취소</button>
            <button onClick={submit} disabled={submitting}
              className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-60">
              {submitting && <Loader2 size={13} className="animate-spin" />}
              저장
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="grid md:grid-cols-4 gap-4">
          {/* 목록 */}
          <aside className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">ERD가 없습니다.<br />AI로 생성하거나 직접 추가하세요.</p>
            )}
            {items.map((a) => (
              <button key={a.id} onClick={() => { setSelectedId(a.id); setEditingCode(null) }}
                className={`w-full text-left border rounded-lg p-3 hover:shadow-sm transition bg-card ${selected?.id === a.id ? 'border-primary' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{a.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-1">v{a.version}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{a._count?.versions ?? 1}개 버전</div>
              </button>
            ))}
          </aside>

          {/* 다이어그램 + 편집기 */}
          <main className="md:col-span-3 space-y-3">
            {selected ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{selected.title} <span className="text-muted-foreground font-normal text-xs">v{selected.version}</span></span>
                  <div className="flex items-center gap-2">
                    {editingCode !== null ? (
                      <>
                        <button onClick={() => setEditingCode(null)} className="inline-flex items-center gap-1 text-xs border rounded-md px-2 py-1 hover:bg-muted">
                          <X size={11} /> 취소
                        </button>
                        <button onClick={saveEdit} disabled={savingEdit}
                          className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-md px-2 py-1 hover:opacity-90 disabled:opacity-60">
                          {savingEdit ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                          저장 (새 버전)
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEditingCode(selected.mermaidCode ?? '')}
                        className="inline-flex items-center gap-1 text-xs border rounded-md px-2 py-1 hover:bg-muted">
                        <Pencil size={11} /> 편집
                      </button>
                    )}
                  </div>
                </div>

                {editingCode !== null ? (
                  <div className="grid lg:grid-cols-2 gap-3">
                    <textarea value={editingCode} onChange={(e) => setEditingCode(e.target.value)}
                      rows={20} spellCheck={false}
                      className="w-full border rounded-md px-3 py-2 text-xs font-mono bg-background resize-none" />
                    <MermaidViewer code={editingCode} theme={theme} />
                  </div>
                ) : (
                  selected.mermaidCode
                    ? <MermaidViewer code={selected.mermaidCode} theme={theme} />
                    : <p className="text-sm text-muted-foreground">ERD 코드가 없습니다.</p>
                )}
              </>
            ) : (
              <div className="border border-dashed rounded-xl p-12 text-center text-sm text-muted-foreground">
                왼쪽에서 ERD를 선택하거나 새로 추가하세요.
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
