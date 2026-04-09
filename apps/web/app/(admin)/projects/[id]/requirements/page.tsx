'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api-client'

interface Requirement {
  id: string
  title: string
  featureFile: string
  platforms: string[]
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED'
  version: number
  updatedAt: string
  _count?: { versions: number; requirementLinks: number }
}

const statusColors: Record<string, string> = {
  DRAFT: 'text-gray-600 bg-gray-50',
  PENDING_APPROVAL: 'text-yellow-600 bg-yellow-50',
  APPROVED: 'text-green-600 bg-green-50',
  REJECTED: 'text-red-600 bg-red-50',
  SUPERSEDED: 'text-blue-600 bg-blue-50',
}

const PLATFORMS = ['MACOS', 'WINDOWS', 'IOS', 'ANDROID', 'WEB', 'LINUX'] as const

const FEATURE_TEMPLATE =
  '@web\nFeature: <요구사항 제목>\n  Scenario: <시나리오 이름>\n    Given <사전 조건>\n    When <행동>\n    Then <기대 결과>'

export default function RequirementsPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [items, setItems] = useState<Requirement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [featureFile, setFeatureFile] = useState(FEATURE_TEMPLATE)
  const [platforms, setPlatforms] = useState<string[]>(['WEB'])

  const load = () =>
    apiClient
      .get(`/api/requirements?projectId=${projectId}`)
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))

  useEffect(() => { load() }, [projectId])

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const submit = async () => {
    if (!title.trim() || !featureFile.trim() || platforms.length === 0) return
    await apiClient.post('/api/requirements', { projectId, title, featureFile, platforms })
    setTitle('')
    setFeatureFile(FEATURE_TEMPLATE)
    setPlatforms(['WEB'])
    setShowForm(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/projects/${projectId}`} className="text-xs text-muted-foreground hover:underline">
            ← Project
          </Link>
          <h1 className="text-2xl font-bold mt-1">Requirements</h1>
          <p className="text-sm text-muted-foreground">
            Cucumber BDD feature files. Editing a feature snapshots a new version.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90"
        >
          {showForm ? 'Cancel' : 'New Requirement'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. User Login)"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`text-xs px-3 py-1 rounded-full border ${
                  platforms.includes(p)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            value={featureFile}
            onChange={(e) => setFeatureFile(e.target.value)}
            rows={10}
            className="w-full border rounded-md px-3 py-2 text-xs font-mono"
          />
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

      <div className="space-y-2">
        {items.map((r) => (
          <div key={r.id} className="bg-card border rounded-lg p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{r.title}</h3>
                <span className="text-xs text-muted-foreground">v{r.version}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {r.platforms.map((p) => (
                  <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded">{p}</span>
                ))}
              </div>
              {r._count && (
                <div className="text-xs text-muted-foreground mt-2">
                  {r._count.versions} versions · {r._count.requirementLinks} linked work items
                </div>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColors[r.status]}`}>
              {r.status}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No requirements yet.</p>
        )}
      </div>
    </div>
  )
}
