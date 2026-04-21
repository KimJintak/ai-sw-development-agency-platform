'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { CheckCircle2, XCircle, MinusCircle, Play, Plus, ChevronDown, ChevronRight } from 'lucide-react'

type Platform = 'MACOS' | 'WINDOWS' | 'IOS' | 'ANDROID' | 'WEB' | 'LINUX'
type TestResultStatus = 'PASSED' | 'FAILED' | 'SKIPPED'
type TestRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

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

interface TestRun {
  id: string
  platform: Platform
  status: TestRunStatus
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  release: { id: string; version: string }
  _count: { testResults: number }
}

interface TestResult {
  id: string
  status: TestResultStatus
  duration: number | null
  errorLog: string | null
  createdAt: string
  testCase: { id: string; title: string; platform: Platform | null }
}

interface RunSummary {
  passed: number
  failed: number
  skipped: number
  total: number
}

interface Coverage {
  totalWorkItems: number
  workItemsWithTests: number
  totalTestCases: number
  coveragePercent: number
}

interface Release {
  id: string
  version: string
  status: string
  platforms: Platform[]
}

const PLATFORMS: Platform[] = ['MACOS', 'WINDOWS', 'IOS', 'ANDROID', 'WEB', 'LINUX']

const STATUS_ICON: Record<TestResultStatus, React.ReactNode> = {
  PASSED: <CheckCircle2 size={14} className="text-green-500" />,
  FAILED: <XCircle size={14} className="text-red-500" />,
  SKIPPED: <MinusCircle size={14} className="text-yellow-500" />,
}

const RUN_STATUS_BADGE: Record<TestRunStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
}

export default function QaPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [tab, setTab] = useState<'cases' | 'runs'>('cases')

  // ── Test Cases state ──
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [selectedWI, setSelectedWI] = useState<string | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [coverage, setCoverage] = useState<Coverage | null>(null)
  const [showCaseForm, setShowCaseForm] = useState(false)
  const [caseTitle, setCaseTitle] = useState('')
  const [caseScenario, setCaseScenario] = useState('')
  const [casePlatform, setCasePlatform] = useState<Platform | ''>('')

  // ── Test Runs state ──
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [showRunForm, setShowRunForm] = useState(false)
  const [runRelease, setRunRelease] = useState('')
  const [runPlatform, setRunPlatform] = useState<Platform | ''>('')
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [runResults, setRunResults] = useState<Record<string, TestResult[]>>({})
  const [runSummaries, setRunSummaries] = useState<Record<string, RunSummary>>({})

  const loadCoverage = () =>
    apiClient.get<Coverage>(`/api/qa/coverage/${projectId}`).then((r) => setCoverage(r.data)).catch(() => null)

  const loadTestCases = (wiId: string) =>
    apiClient.get<TestCase[]>(`/api/qa/test-cases?workItemId=${wiId}`).then((r) => setTestCases(r.data)).catch(() => setTestCases([]))

  const loadRuns = () =>
    apiClient.get<TestRun[]>(`/api/qa/project-runs/${projectId}`).then((r) => setTestRuns(r.data)).catch(() => setTestRuns([]))

  useEffect(() => {
    apiClient.get<WorkItem[]>(`/api/work-items?projectId=${projectId}`).then((r) => {
      setWorkItems(r.data)
      if (r.data.length > 0) setSelectedWI(r.data[0].id)
    }).catch(() => setWorkItems([]))
    loadCoverage()
    apiClient.get<Release[]>(`/api/releases?projectId=${projectId}`).then((r) => setReleases(r.data)).catch(() => setReleases([]))
    loadRuns()
  }, [projectId])

  useEffect(() => {
    if (selectedWI) loadTestCases(selectedWI)
  }, [selectedWI])

  const submitCase = async () => {
    if (!caseTitle.trim() || !caseScenario.trim() || !selectedWI) return
    await apiClient.post('/api/qa/test-cases', {
      workItemId: selectedWI,
      title: caseTitle,
      scenario: caseScenario,
      platform: casePlatform || undefined,
    })
    setCaseTitle(''); setCaseScenario(''); setCasePlatform('')
    setShowCaseForm(false)
    if (selectedWI) loadTestCases(selectedWI)
    loadCoverage()
  }

  const submitRun = async () => {
    if (!runRelease || !runPlatform) return
    await apiClient.post('/api/qa/test-runs', { releaseId: runRelease, platform: runPlatform })
    setShowRunForm(false); setRunRelease(''); setRunPlatform('')
    loadRuns()
  }

  const toggleRun = async (runId: string) => {
    if (expandedRun === runId) { setExpandedRun(null); return }
    setExpandedRun(runId)
    if (!runResults[runId]) {
      const [resultsRes, summaryRes] = await Promise.all([
        apiClient.get<TestResult[]>(`/api/qa/test-runs/${runId}/results`),
        apiClient.get<RunSummary>(`/api/qa/test-runs/${runId}/summary`),
      ])
      setRunResults((p) => ({ ...p, [runId]: resultsRes.data }))
      setRunSummaries((p) => ({ ...p, [runId]: summaryRes.data }))
    }
  }

  const updateRunStatus = async (runId: string, status: TestRunStatus) => {
    await apiClient.patch(`/api/qa/test-runs/${runId}`, { status })
    loadRuns()
  }

  const recordResult = async (runId: string, testCaseId: string, status: TestResultStatus) => {
    await apiClient.post(`/api/qa/test-runs/${runId}/results`, { testCaseId, status })
    const [resultsRes, summaryRes] = await Promise.all([
      apiClient.get<TestResult[]>(`/api/qa/test-runs/${runId}/results`),
      apiClient.get<RunSummary>(`/api/qa/test-runs/${runId}/summary`),
    ])
    setRunResults((p) => ({ ...p, [runId]: resultsRes.data }))
    setRunSummaries((p) => ({ ...p, [runId]: summaryRes.data }))
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${projectId}`} className="text-xs text-muted-foreground hover:underline">
          ← Project
        </Link>
        <h1 className="text-2xl font-bold mt-1">QA &amp; Testing</h1>
      </div>

      {/* Coverage summary */}
      {coverage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Coverage', value: `${coverage.coveragePercent}%` },
            { label: 'Test Cases', value: coverage.totalTestCases },
            { label: 'Items Covered', value: coverage.workItemsWithTests },
            { label: 'Total Items', value: coverage.totalWorkItems },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['cases', 'runs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              tab === t ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'cases' ? '테스트 케이스' : '테스트 런'}
          </button>
        ))}
      </div>

      {/* ── Test Cases Tab ── */}
      {tab === 'cases' && (
        <div className="grid md:grid-cols-3 gap-4">
          <aside className="md:col-span-1 space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Work Items</h2>
            {workItems.map((wi) => (
              <button
                key={wi.id}
                onClick={() => setSelectedWI(wi.id)}
                className={`w-full text-left bg-card border rounded-lg p-3 hover:shadow-sm transition ${selectedWI === wi.id ? 'border-primary' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{wi.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{wi.type}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{wi.status}</div>
              </button>
            ))}
            {workItems.length === 0 && <p className="text-sm text-muted-foreground">Work item이 없습니다.</p>}
          </aside>

          <main className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                테스트 케이스 {selectedWI && `(${testCases.length})`}
              </h2>
              {selectedWI && (
                <button
                  onClick={() => setShowCaseForm((v) => !v)}
                  className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1 rounded-md hover:opacity-90"
                >
                  <Plus size={14} /> {showCaseForm ? '취소' : '새 케이스'}
                </button>
              )}
            </div>

            {showCaseForm && (
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <input
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="테스트 케이스 제목"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                />
                <textarea
                  value={caseScenario}
                  onChange={(e) => setCaseScenario(e.target.value)}
                  placeholder="Given ...\nWhen ...\nThen ..."
                  rows={5}
                  className="w-full border rounded-md px-3 py-2 text-xs font-mono bg-background"
                />
                <div className="flex items-center gap-3">
                  <select
                    value={casePlatform}
                    onChange={(e) => setCasePlatform(e.target.value as Platform)}
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">전체 플랫폼</option>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button
                    onClick={submitCase}
                    disabled={!caseTitle.trim() || !caseScenario.trim()}
                    className="ml-auto bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
                  >
                    생성
                  </button>
                </div>
              </div>
            )}

            {testCases.map((tc) => (
              <div key={tc.id} className="bg-card border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{tc.title}</span>
                  <div className="flex items-center gap-2">
                    {tc.platform && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">{tc.platform}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{tc._count?.testResults ?? 0} runs</span>
                  </div>
                </div>
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-muted/50 rounded p-2">
                  {tc.scenario}
                </pre>
              </div>
            ))}

            {selectedWI && testCases.length === 0 && !showCaseForm && (
              <p className="text-sm text-muted-foreground">아직 테스트 케이스가 없습니다.</p>
            )}
            {!selectedWI && <p className="text-sm text-muted-foreground">왼쪽에서 Work Item을 선택하세요.</p>}
          </main>
        </div>
      )}

      {/* ── Test Runs Tab ── */}
      {tab === 'runs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">테스트 런 ({testRuns.length})</h2>
            <button
              onClick={() => setShowRunForm((v) => !v)}
              className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
            >
              <Plus size={14} /> {showRunForm ? '취소' : '새 런'}
            </button>
          </div>

          {showRunForm && (
            <div className="bg-card border rounded-lg p-4 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="text-xs text-muted-foreground block mb-1">릴리스</label>
                <select
                  value={runRelease}
                  onChange={(e) => setRunRelease(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">릴리스 선택</option>
                  {releases.map((r) => <option key={r.id} value={r.id}>{r.version}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-40">
                <label className="text-xs text-muted-foreground block mb-1">플랫폼</label>
                <select
                  value={runPlatform}
                  onChange={(e) => setRunPlatform(e.target.value as Platform)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">플랫폼 선택</option>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button
                onClick={submitRun}
                disabled={!runRelease || !runPlatform}
                className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
              >
                생성
              </button>
            </div>
          )}

          {testRuns.length === 0 && (
            <div className="border rounded-lg p-10 text-center text-sm text-muted-foreground">
              테스트 런이 없습니다. 릴리스 후 새 런을 생성하세요.
            </div>
          )}

          {testRuns.map((run) => {
            const summary = runSummaries[run.id]
            const results = runResults[run.id] ?? []
            const isExpanded = expandedRun === run.id

            return (
              <div key={run.id} className="border rounded-lg bg-card overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30"
                  onClick={() => toggleRun(run.id)}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="font-medium text-sm flex-1">
                    {run.release.version} — {run.platform}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RUN_STATUS_BADGE[run.status]}`}>
                    {run.status}
                  </span>
                  {summary && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600">{summary.passed}P</span>
                      <span className="text-red-600">{summary.failed}F</span>
                      <span className="text-yellow-600">{summary.skipped}S</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{run._count.testResults} results</span>
                  {/* Status controls */}
                  {run.status === 'PENDING' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateRunStatus(run.id, 'RUNNING') }}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      <Play size={10} /> 시작
                    </button>
                  )}
                  {run.status === 'RUNNING' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateRunStatus(run.id, 'COMPLETED') }}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      <CheckCircle2 size={10} /> 완료
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t divide-y">
                    {/* Quick-record panel (when RUNNING) */}
                    {run.status === 'RUNNING' && (
                      <QuickRecord
                        projectId={projectId}
                        runId={run.id}
                        onRecord={(tcId, status) => recordResult(run.id, tcId, status)}
                      />
                    )}
                    {results.length === 0 && (
                      <div className="px-4 py-4 text-sm text-muted-foreground">아직 결과가 없습니다.</div>
                    )}
                    {results.map((r) => (
                      <div key={r.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                        {STATUS_ICON[r.status]}
                        <span className="flex-1 truncate">{r.testCase.title}</span>
                        {r.testCase.platform && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{r.testCase.platform}</span>
                        )}
                        {r.duration && (
                          <span className="text-xs text-muted-foreground">{r.duration}ms</span>
                        )}
                        {r.errorLog && (
                          <span className="text-xs text-red-500 truncate max-w-40" title={r.errorLog}>{r.errorLog}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function QuickRecord({
  projectId,
  runId,
  onRecord,
}: {
  projectId: string
  runId: string
  onRecord: (testCaseId: string, status: TestResultStatus) => void
}) {
  const [cases, setCases] = useState<{ id: string; title: string; workItem: { title: string } | null }[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    apiClient
      .get<{ id: string; title: string; workItem: { title: string } | null }[]>(
        `/api/work-items?projectId=${projectId}`,
      )
      .then(async (wiRes) => {
        const allCases: typeof cases = []
        for (const wi of wiRes.data) {
          const tcRes = await apiClient.get<TestCase[]>(`/api/qa/test-cases?workItemId=${wi.id}`)
          allCases.push(...tcRes.data.map((tc) => ({ id: tc.id, title: tc.title, workItem: { title: wi.title } })))
        }
        setCases(allCases)
        if (allCases.length > 0) setSelected(allCases[0].id)
      })
      .catch(() => null)
  }, [projectId])

  if (cases.length === 0) return null

  return (
    <div className="px-4 py-3 bg-muted/20 flex flex-wrap items-center gap-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 min-w-48 border rounded-md px-2 py-1.5 text-xs bg-background"
      >
        {cases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.workItem?.title ? `[${c.workItem.title}] ` : ''}{c.title}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        {(['PASSED', 'FAILED', 'SKIPPED'] as TestResultStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => selected && onRecord(selected, s)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded font-medium ${
              s === 'PASSED' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
              s === 'FAILED' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
              'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            {STATUS_ICON_SMALL[s]} {s}
          </button>
        ))}
      </div>
    </div>
  )
}

const STATUS_ICON_SMALL: Record<TestResultStatus, React.ReactNode> = {
  PASSED: <CheckCircle2 size={11} />,
  FAILED: <XCircle size={11} />,
  SKIPPED: <MinusCircle size={11} />,
}
