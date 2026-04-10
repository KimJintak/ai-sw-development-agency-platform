'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api-client'

/* ── Types ── */

type Platform = 'MACOS' | 'WINDOWS' | 'IOS' | 'ANDROID' | 'WEB' | 'LINUX'
type TestResultStatus = 'PASSED' | 'FAILED' | 'SKIPPED'

interface WorkItem {
  id: string
  title: string
  type: string
  status: string
}

interface TestCase {
  id: string
  title: string
  scenario: string
  platform: Platform | null
  createdAt: string
  workItem?: { id: string; title: string; projectId: string }
  _count?: { testResults: number }
}

interface Coverage {
  totalWorkItems: number
  workItemsWithTests: number
  totalTestCases: number
  coveragePercent: number
}

const PLATFORMS: Platform[] = ['MACOS', 'WINDOWS', 'IOS', 'ANDROID', 'WEB', 'LINUX']

const STATUS_COLORS: Record<TestResultStatus, string> = {
  PASSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-yellow-100 text-yellow-800',
}

export default function QaPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [selectedWI, setSelectedWI] = useState<string | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [coverage, setCoverage] = useState<Coverage | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [scenario, setScenario] = useState('')
  const [platform, setPlatform] = useState<Platform | ''>('')

  // Load work items + coverage
  useEffect(() => {
    apiClient
      .get(`/api/work-items?projectId=${projectId}`)
      .then((r) => {
        setWorkItems(r.data)
        if (r.data.length > 0 && !selectedWI) {
          setSelectedWI(r.data[0].id)
        }
      })
      .catch(() => setWorkItems([]))

    apiClient
      .get(`/api/qa/coverage/${projectId}`)
      .then((r) => setCoverage(r.data))
      .catch(() => setCoverage(null))
  }, [projectId])

  // Load test cases when selected work item changes
  useEffect(() => {
    if (!selectedWI) return
    apiClient
      .get(`/api/qa/test-cases?workItemId=${selectedWI}`)
      .then((r) => setTestCases(r.data))
      .catch(() => setTestCases([]))
  }, [selectedWI])

  const submit = async () => {
    if (!title.trim() || !scenario.trim() || !selectedWI) return
    await apiClient.post('/api/qa/test-cases', {
      workItemId: selectedWI,
      title,
      scenario,
      platform: platform || undefined,
    })
    setTitle('')
    setScenario('')
    setPlatform('')
    setShowForm(false)
    // Refresh test cases + coverage
    apiClient
      .get(`/api/qa/test-cases?workItemId=${selectedWI}`)
      .then((r) => setTestCases(r.data))
    apiClient
      .get(`/api/qa/coverage/${projectId}`)
      .then((r) => setCoverage(r.data))
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Project
        </Link>
        <h1 className="text-2xl font-bold mt-1">QA & Testing</h1>
        <p className="text-sm text-muted-foreground">
          Manage test cases per work item. Track test coverage across the
          project.
        </p>
      </div>

      {/* Coverage summary */}
      {coverage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{coverage.coveragePercent}%</div>
            <div className="text-xs text-muted-foreground">Coverage</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{coverage.totalTestCases}</div>
            <div className="text-xs text-muted-foreground">Test Cases</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{coverage.workItemsWithTests}</div>
            <div className="text-xs text-muted-foreground">Items Covered</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{coverage.totalWorkItems}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Work item sidebar */}
        <aside className="md:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground mb-1">
            Work Items
          </h2>
          {workItems.map((wi) => (
            <button
              key={wi.id}
              onClick={() => setSelectedWI(wi.id)}
              className={`w-full text-left bg-card border rounded-lg p-3 hover:shadow-sm transition ${
                selectedWI === wi.id ? 'border-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{wi.title}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                  {wi.type}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{wi.status}</div>
            </button>
          ))}
          {workItems.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No work items in this project.
            </p>
          )}
        </aside>

        {/* Test cases main */}
        <main className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Test Cases
              {selectedWI && ` (${testCases.length})`}
            </h2>
            {selectedWI && (
              <button
                onClick={() => setShowForm((v) => !v)}
                className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-md hover:opacity-90"
              >
                {showForm ? 'Cancel' : 'New Test Case'}
              </button>
            )}
          </div>

          {/* Create form */}
          {showForm && (
            <div className="bg-card border rounded-lg p-4 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Test case title"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="Test scenario / steps&#10;Given ...&#10;When ...&#10;Then ..."
                rows={6}
                className="w-full border rounded-md px-3 py-2 text-xs font-mono"
              />
              <div className="flex items-center gap-3">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Platforms</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="flex-1" />
                <button
                  onClick={submit}
                  className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Test case list */}
          {testCases.map((tc) => (
            <div
              key={tc.id}
              className="bg-card border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{tc.title}</span>
                <div className="flex items-center gap-2">
                  {tc.platform && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      {tc.platform}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {tc._count?.testResults ?? 0} runs
                  </span>
                </div>
              </div>
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-muted/50 rounded p-2">
                {tc.scenario}
              </pre>
            </div>
          ))}

          {selectedWI && testCases.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground">
              No test cases yet. Click &quot;New Test Case&quot; to create one.
            </p>
          )}

          {!selectedWI && (
            <p className="text-sm text-muted-foreground">
              Select a work item to view its test cases.
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
