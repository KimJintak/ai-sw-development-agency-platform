'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { useI18n } from '@/lib/i18n/i18n-context'
import type { Project } from 'shared-types'
import { Github, Lock, Unlock, ChevronDown, Search, Loader2 } from 'lucide-react'

interface Customer {
  id: string
  companyName: string
}

interface RepoItem {
  fullName: string
  name: string
  private: boolean
  description: string | null
  topics: string[]
  language: string | null
  defaultBranch: string
  htmlUrl: string
}

const PLATFORMS = ['MACOS', 'WINDOWS', 'IOS', 'ANDROID', 'WEB', 'LINUX'] as const

const TOPIC_TO_PLATFORM: Record<string, string> = {
  ios: 'IOS', iphone: 'IOS', swift: 'IOS', swiftui: 'IOS',
  android: 'ANDROID', kotlin: 'ANDROID',
  web: 'WEB', frontend: 'WEB', react: 'WEB', nextjs: 'WEB', vue: 'WEB', angular: 'WEB',
  macos: 'MACOS', mac: 'MACOS', electron: 'MACOS',
  windows: 'WINDOWS', dotnet: 'WINDOWS', wpf: 'WINDOWS', winforms: 'WINDOWS',
  linux: 'LINUX', ubuntu: 'LINUX',
}

function inferPlatforms(topics: string[], language: string | null): string[] {
  const found = new Set<string>()
  for (const t of topics) {
    const p = TOPIC_TO_PLATFORM[t.toLowerCase()]
    if (p) found.add(p)
  }
  if (language) {
    const p = TOPIC_TO_PLATFORM[language.toLowerCase()]
    if (p) found.add(p)
  }
  return Array.from(found)
}

function repoNameToTitle(repoName: string): string {
  return repoName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ProjectsPage() {
  const { t } = useI18n()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])

  // form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [githubRepo, setGithubRepo] = useState('')
  const [repoPickerOpen, setRepoPickerOpen] = useState(false)
  const [repoSearch, setRepoSearch] = useState('')
  const [repoList, setRepoList] = useState<RepoItem[]>([])
  const [repoLoading, setRepoLoading] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get('/api/projects').then((r) => setProjects(r.data)).catch(() => {})
  }, [])

  const openForm = () => {
    apiClient.get('/api/customers').then((r) => setCustomers(r.data)).catch(() => {})
    setShowForm(true)
  }

  const openRepoPicker = async () => {
    setRepoPickerOpen(true)
    if (repoList.length > 0) return
    setRepoLoading(true)
    try {
      const res = await apiClient.get<RepoItem[]>('/api/scm/repos')
      setRepoList(res.data)
    } catch {
      setRepoList([])
    } finally {
      setRepoLoading(false)
    }
  }

  const selectRepo = (r: RepoItem) => {
    setGithubRepo(r.fullName)
    if (!name.trim()) setName(repoNameToTitle(r.name))
    if (!description.trim() && r.description) setDescription(r.description)
    const inferred = inferPlatforms(r.topics, r.language)
    if (platforms.length === 0 && inferred.length > 0) setPlatforms(inferred)
    setRepoPickerOpen(false)
    setRepoSearch('')
  }

  const filteredRepos = repoList.filter((r) =>
    r.fullName.toLowerCase().includes(repoSearch.toLowerCase())
  )

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  const submit = async () => {
    setSubmitError(null)
    if (!name.trim()) { setSubmitError('프로젝트 이름을 입력하세요.'); return }
    if (!customerId) { setSubmitError('고객사를 선택하세요.'); return }
    if (platforms.length === 0) { setSubmitError('플랫폼을 하나 이상 선택하세요.'); return }
    setSubmitting(true)
    try {
      await apiClient.post('/api/projects', {
        name,
        description: description || undefined,
        customerId,
        platforms,
        githubRepo: githubRepo || undefined,
      })
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : (msg ?? '프로젝트 생성에 실패했습니다.'))
      setSubmitting(false)
      return
    }
    setName('')
    setDescription('')
    setCustomerId('')
    setPlatforms([])
    setGithubRepo('')
    setSubmitError(null)
    setSubmitting(false)
    setShowForm(false)
    apiClient.get('/api/projects').then((r) => setProjects(r.data))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('projects.title')}</h1>
        <button
          onClick={() => showForm ? setShowForm(false) : openForm()}
          className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90"
        >
          {showForm ? 'Cancel' : t('projects.new')}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition ${
                    platforms.includes(p)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GitHub Repo (optional)</label>
            <div className="flex gap-2">
              <input
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="org/repo"
                className="flex-1 border rounded-md px-3 py-2 text-sm bg-background"
              />
              <button
                type="button"
                onClick={openRepoPicker}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-md hover:bg-muted whitespace-nowrap"
              >
                <Github size={14} />
                GitHub에서 가져오기
                <ChevronDown size={12} />
              </button>
            </div>

            {repoPickerOpen && (
              <div ref={pickerRef} className="mt-2 border rounded-lg bg-popover shadow-lg z-50">
                <div className="p-2 border-b flex items-center gap-2">
                  <Search size={13} className="text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="저장소 검색..."
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { setRepoPickerOpen(false); setRepoSearch('') }}
                    className="text-xs text-muted-foreground hover:text-foreground px-1"
                  >
                    닫기
                  </button>
                </div>
                <ul className="max-h-52 overflow-y-auto divide-y divide-border">
                  {repoLoading ? (
                    <li className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" /> 불러오는 중...
                    </li>
                  ) : filteredRepos.length === 0 ? (
                    <li className="py-6 text-center text-sm text-muted-foreground">저장소가 없습니다.</li>
                  ) : filteredRepos.map((r) => {
                    const inferred = inferPlatforms(r.topics, r.language)
                    return (
                      <li key={r.fullName}>
                        <button
                          type="button"
                          onClick={() => selectRepo(r)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted/60"
                        >
                          {r.private ? <Lock size={12} className="text-amber-500 shrink-0" /> : <Unlock size={12} className="text-emerald-500 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{r.fullName}</div>
                            {r.description && <div className="text-xs text-muted-foreground truncate">{r.description}</div>}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.language && (
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{r.language}</span>
                              )}
                              {inferred.map((p) => (
                                <span key={p} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p}</span>
                              ))}
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
              {submitError}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? '생성 중...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        {projects.length === 0 && (
          <p className="col-span-3 text-muted-foreground text-sm">{t('projects.empty')}</p>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    ACTIVE: 'text-green-600 bg-green-50',
    ON_HOLD: 'text-yellow-600 bg-yellow-50',
    COMPLETED: 'text-blue-600 bg-blue-50',
    ARCHIVED: 'text-gray-500 bg-gray-50',
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-base leading-tight">{project.name}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColors[project.status]}`}>
            {project.status}
          </span>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {project.platforms.map((p) => (
            <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded">{p}</span>
          ))}
        </div>

        {project.progress !== undefined && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary rounded-full h-1.5 transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
