'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { MermaidViewer } from '@/components/design/mermaid-viewer'
import { Sparkles, Loader2 } from 'lucide-react'

type ArtifactType = 'ARCHITECTURE' | 'ERD' | 'WIREFRAME' | 'FLOWCHART' | 'SEQUENCE'
type MermaidTheme = 'default' | 'dark' | 'forest' | 'neutral'

interface DesignArtifact {
  id: string
  type: ArtifactType
  title: string
  mermaidCode?: string | null
  figmaUrl?: string | null
  version: number
  updatedAt: string
  _count?: { versions: number }
}

const TABS: ArtifactType[] = ['ARCHITECTURE', 'ERD', 'WIREFRAME', 'FLOWCHART', 'SEQUENCE']

const MERMAID_TEMPLATES: Record<Exclude<ArtifactType, 'WIREFRAME'>, string> = {
  ARCHITECTURE: 'graph TD\n  Client --> API\n  API --> DB[(Postgres)]\n  API --> Redis',
  ERD: 'erDiagram\n  USER ||--o{ PROJECT : owns\n  PROJECT ||--|{ WORK_ITEM : contains',
  FLOWCHART: 'flowchart LR\n  Start --> Task1 --> Task2 --> End',
  SEQUENCE: 'sequenceDiagram\n  Client->>API: POST /login\n  API-->>Client: JWT',
}

export default function DesignHubPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<ArtifactType>('ARCHITECTURE')
  const [items, setItems] = useState<DesignArtifact[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [theme, setTheme] = useState<MermaidTheme>('default')
  const [showForm, setShowForm] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiContext, setAiContext] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPreview, setAiPreview] = useState<{ title: string; mermaidCode: string } | null>(null)
  const [title, setTitle] = useState('')
  const [mermaidCode, setMermaidCode] = useState('')
  const [figmaUrl, setFigmaUrl] = useState('')

  useEffect(() => {
    apiClient
      .get(`/api/design?projectId=${projectId}&type=${activeTab}`)
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
    setSelectedId(null)
  }, [projectId, activeTab])

  useEffect(() => {
    if (activeTab === 'WIREFRAME') {
      setMermaidCode('')
    } else {
      setMermaidCode(MERMAID_TEMPLATES[activeTab])
    }
    setFigmaUrl('')
  }, [activeTab])

  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null

  const reload = () =>
    apiClient.get(`/api/design?projectId=${projectId}&type=${activeTab}`).then((r) => setItems(r.data))

  const submit = async () => {
    if (!title.trim()) return
    if (activeTab === 'WIREFRAME' && !figmaUrl.trim()) return
    if (activeTab !== 'WIREFRAME' && !mermaidCode.trim()) return
    await apiClient.post('/api/design', {
      projectId,
      type: activeTab,
      title,
      mermaidCode: activeTab === 'WIREFRAME' ? undefined : mermaidCode,
      figmaUrl: activeTab === 'WIREFRAME' ? figmaUrl : undefined,
    })
    setTitle('')
    setShowForm(false)
    reload()
  }

  const generateWithAI = async () => {
    if (!aiContext.trim() || activeTab === 'WIREFRAME') return
    setAiGenerating(true)
    setAiPreview(null)
    try {
      const r = await apiClient.post<{ title: string; mermaidCode: string }>('/api/design/generate', {
        projectId,
        projectName: projectId,
        diagramType: activeTab,
        context: aiContext,
        save: false,
      })
      setAiPreview(r.data)
    } finally {
      setAiGenerating(false)
    }
  }

  const saveAiResult = async () => {
    if (!aiPreview) return
    await apiClient.post('/api/design/generate', {
      projectId,
      projectName: projectId,
      diagramType: activeTab,
      context: aiContext,
      save: true,
    })
    setShowAiPanel(false)
    setAiPreview(null)
    setAiContext('')
    reload()
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${projectId}`} className="text-xs text-muted-foreground hover:underline">
          ← Project
        </Link>
        <h1 className="text-2xl font-bold mt-1">Design Hub</h1>
        <p className="text-sm text-muted-foreground">
          Architecture / ERD / Wireframe / Flowchart / Sequence diagrams. Content edits snapshot a new version.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              activeTab === t
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
        <div className="flex-1" />
        {activeTab !== 'WIREFRAME' && (
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as MermaidTheme)}
            className="text-xs border rounded-md px-2 py-1"
          >
            <option value="default">default</option>
            <option value="dark">dark</option>
            <option value="forest">forest</option>
            <option value="neutral">neutral</option>
          </select>
        )}
        {activeTab !== 'WIREFRAME' && (
          <button
            onClick={() => { setShowAiPanel((v) => !v); setShowForm(false) }}
            className="flex items-center gap-1.5 text-sm bg-violet-600 text-white px-3 py-1 rounded-md hover:opacity-90"
          >
            <Sparkles size={13} />
            AI 생성
          </button>
        )}
        <button
          onClick={() => { setShowForm((v) => !v); setShowAiPanel(false) }}
          className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-md hover:opacity-90"
        >
          {showForm ? 'Cancel' : 'New'}
        </button>
      </div>

      {/* AI 자동 생성 패널 (FR-06-07) */}
      {showAiPanel && activeTab !== 'WIREFRAME' && (
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-400">
            <Sparkles size={14} />
            UX Agent — {activeTab} 다이어그램 자동 생성
          </div>
          <textarea
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            rows={4}
            placeholder="요구사항, 기능 명세, 또는 시스템 설명을 입력하세요..."
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={generateWithAI}
              disabled={!aiContext.trim() || aiGenerating}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg disabled:opacity-50 hover:opacity-90"
            >
              {aiGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {aiGenerating ? '생성 중...' : '미리보기 생성'}
            </button>
            {aiPreview && (
              <button
                onClick={saveAiResult}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:opacity-90"
              >
                저장
              </button>
            )}
          </div>
          {aiPreview && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">미리보기: {aiPreview.title}</div>
              <MermaidViewer code={aiPreview.mermaidCode} theme={theme} />
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer">Mermaid 코드 보기</summary>
                <pre className="mt-1 text-xs font-mono bg-muted p-3 rounded-lg overflow-auto whitespace-pre-wrap">
                  {aiPreview.mermaidCode}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          {activeTab === 'WIREFRAME' ? (
            <input
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/embed?embed_host=..."
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            />
          ) : (
            <textarea
              value={mermaidCode}
              onChange={(e) => setMermaidCode(e.target.value)}
              rows={10}
              className="w-full border rounded-md px-3 py-2 text-xs font-mono"
            />
          )}
          <div className="flex justify-end">
            <button
              onClick={submit}
              className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90"
            >
              Create v1
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <aside className="md:col-span-1 space-y-2">
          {items.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className={`w-full text-left bg-card border rounded-lg p-3 hover:shadow-sm transition ${
                selected?.id === a.id ? 'border-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{a.title}</span>
                <span className="text-xs text-muted-foreground">v{a.version}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {a._count?.versions ?? 1} versions
              </div>
            </button>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No {activeTab.toLowerCase()} artifacts yet.</p>
          )}
        </aside>

        <main className="md:col-span-2">
          {selected ? (
            selected.type === 'WIREFRAME' && selected.figmaUrl ? (
              <iframe
                src={selected.figmaUrl}
                className="w-full h-[600px] border rounded-lg bg-white"
                allowFullScreen
              />
            ) : selected.mermaidCode ? (
              <MermaidViewer code={selected.mermaidCode} theme={theme} />
            ) : (
              <p className="text-sm text-muted-foreground">Empty artifact.</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">Select an artifact to preview.</p>
          )}
        </main>
      </div>
    </div>
  )
}
