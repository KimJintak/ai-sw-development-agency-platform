'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  ExternalLink,
  Github,
  AlertTriangle,
  Star,
  CircleDot,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react'

interface RepoMeta {
  owner: string
  repo: string
  defaultBranch: string
  private: boolean
  htmlUrl: string
  description: string | null
  pushedAt: string | null
  stargazersCount: number
  openIssuesCount: number
}

interface Branch {
  name: string
  sha: string
  protected: boolean
}

interface Commit {
  sha: string
  message: string
  author: string
  date: string | null
  url: string
}

interface PullRequest {
  number: number
  title: string
  state: string
  draft: boolean
  user: string | null
  head: string
  base: string
  createdAt: string
  updatedAt: string
  mergedAt: string | null
  htmlUrl: string
}

export default function ProjectSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [repo, setRepo] = useState<RepoMeta | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [commits, setCommits] = useState<Commit[]>([])
  const [pulls, setPulls] = useState<PullRequest[]>([])
  const [prState, setPrState] = useState<'open' | 'closed' | 'all'>('open')
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [repoRes, branchesRes] = await Promise.all([
        apiClient.get<RepoMeta>(`/api/projects/${id}/scm/repo`),
        apiClient.get<Branch[]>(`/api/projects/${id}/scm/branches`),
      ])
      setRepo(repoRes.data)
      setBranches(branchesRes.data)
      setSelectedBranch(repoRes.data.defaultBranch)
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? (e as Error).message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadCommits = useCallback(async (branch: string | undefined) => {
    try {
      const res = await apiClient.get<Commit[]>(`/api/projects/${id}/scm/commits`, {
        params: branch ? { branch } : undefined,
      })
      setCommits(res.data)
    } catch {}
  }, [id])

  const loadPulls = useCallback(async (state: 'open' | 'closed' | 'all') => {
    try {
      const res = await apiClient.get<PullRequest[]>(`/api/projects/${id}/scm/pulls`, {
        params: { state },
      })
      setPulls(res.data)
    } catch {}
  }, [id])

  useEffect(() => { void load() }, [load])
  useEffect(() => { if (selectedBranch) void loadCommits(selectedBranch) }, [selectedBranch, loadCommits])
  useEffect(() => { void loadPulls(prState) }, [prState, loadPulls])

  if (loading) {
    return <div className="text-sm text-muted-foreground">소스 저장소 연결 중...</div>
  }

  if (error) {
    return (
      <div className="border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 rounded-lg p-4 text-sm">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium mb-1">
          <AlertTriangle size={14} /> 소스 저장소 연결 불가
        </div>
        <div className="text-amber-700 dark:text-amber-400">{error}</div>
        <div className="text-xs text-muted-foreground mt-2">
          프로젝트 설정에서 <code className="px-1 bg-muted rounded">githubRepo</code>를 등록하고 서버의 <code className="px-1 bg-muted rounded">GITHUB_TOKEN</code>이 설정되어 있어야 합니다.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {repo && (
        <header className="border border-border bg-card rounded-xl p-5 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
              <Github size={12} />
              <span>{repo.owner}</span>
              <span>/</span>
              <span className="font-medium text-foreground">{repo.repo}</span>
              {repo.private ? (
                <Lock size={10} className="text-amber-600" />
              ) : (
                <Unlock size={10} className="text-emerald-600" />
              )}
            </div>
            {repo.description && (
              <p className="text-sm text-muted-foreground">{repo.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><GitBranch size={10} /> {repo.defaultBranch}</span>
              <span className="flex items-center gap-1"><Star size={10} /> {repo.stargazersCount}</span>
              <span className="flex items-center gap-1"><CircleDot size={10} /> {repo.openIssuesCount} issues</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={load} className="h-8 px-2 inline-flex items-center gap-1 text-xs rounded-md border hover:bg-muted">
              <RefreshCw size={12} />
            </button>
            {(repo.htmlUrl === '#' || !repo.htmlUrl) ? (
              <button
                onClick={() => alert('데모 모드 — 실제 저장소가 연결되어 있지 않습니다.\n\n실제 환경에서는 GitHub 저장소 페이지로 이동합니다.')}
                className="h-8 px-3 inline-flex items-center gap-1 text-xs rounded-md bg-muted text-muted-foreground border border-dashed cursor-not-allowed"
              >
                GitHub (데모)
              </button>
            ) : (
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 inline-flex items-center gap-1 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90"
              >
                GitHub 열기 <ExternalLink size={10} />
              </a>
            )}
          </div>
        </header>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-2.5 border-b border-border text-sm font-medium flex items-center gap-2">
            <GitBranch size={14} /> 브랜치 ({branches.length})
          </header>
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {branches.map((b) => (
              <li key={b.name}>
                <button
                  onClick={() => setSelectedBranch(b.name)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-muted/40 ${
                    selectedBranch === b.name ? 'bg-primary/5 text-primary' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{b.name}</span>
                    {b.protected && <Lock size={10} className="text-amber-600 shrink-0" />}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{b.sha}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-2.5 border-b border-border text-sm font-medium flex items-center gap-2">
            <GitCommit size={14} /> 커밋
            {selectedBranch && <span className="text-xs text-muted-foreground ml-1">on {selectedBranch}</span>}
          </header>
          <ul className="divide-y divide-border max-h-80 overflow-y-auto">
            {commits.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground">커밋이 없습니다.</li>
            ) : commits.map((c) => (
              <li key={c.sha}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{c.message}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.author} · {c.date ? new Date(c.date).toLocaleString('ko-KR') : '—'}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{c.sha}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <header className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <GitPullRequest size={14} /> Pull Requests ({pulls.length})
          </span>
          <div className="inline-flex rounded-md border border-border p-0.5">
            {(['open', 'closed', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPrState(s)}
                className={`px-2.5 py-1 text-xs rounded ${
                  prState === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </header>
        <ul className="divide-y divide-border max-h-[450px] overflow-y-auto">
          {pulls.length === 0 ? (
            <li className="p-8 text-center text-sm text-muted-foreground">PR이 없습니다.</li>
          ) : pulls.map((pr) => (
            <li key={pr.number}>
              <Link
                href={`/projects/${id}/source/pr/${pr.number}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <span className="mt-0.5 shrink-0">
                  {pr.mergedAt ? (
                    <GitMerge size={14} className="text-violet-600" />
                  ) : pr.state === 'closed' ? (
                    <GitPullRequest size={14} className="text-red-600" />
                  ) : pr.draft ? (
                    <GitPullRequest size={14} className="text-muted-foreground" />
                  ) : (
                    <GitPullRequest size={14} className="text-emerald-600" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium truncate">{pr.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">#{pr.number}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{pr.user ?? '—'}</span>
                    <span>·</span>
                    <span className="font-mono">{pr.head} → {pr.base}</span>
                    <span>·</span>
                    <span>{new Date(pr.updatedAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
