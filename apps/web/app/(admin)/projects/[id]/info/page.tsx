'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api-client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Github, FileText, Loader2, ExternalLink } from 'lucide-react'

interface ProjectInfo {
  name: string
  description: string | null
  githubRepo: string | null
  platforms: string[]
  status: string
}

export default function InfoPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [readme, setReadme] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [repoMeta, setRepoMeta] = useState<{ htmlUrl: string; defaultBranch: string; stargazersCount: number; pushedAt: string | null } | null>(null)

  useEffect(() => {
    apiClient.get(`/api/projects/${id}`).then((r) => {
      setProject(r.data)
      const githubRepo = r.data.githubRepo
      if (githubRepo) {
        Promise.all([
          apiClient.get<{ content: string | null }>(`/api/projects/${id}/scm/readme`),
          apiClient.get(`/api/projects/${id}/scm/repo`),
        ]).then(([rdRes, repoRes]) => {
          setReadme(rdRes.data.content)
          setRepoMeta(repoRes.data)
        }).catch(() => {}).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [id])

  if (!project) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div className="space-y-5">
      {/* 프로젝트 메타 */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{project.name}</h2>
            {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
            project.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
            project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
            project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>{project.status}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.platforms.map((p) => (
            <span key={p} className="text-xs bg-muted px-2.5 py-1 rounded-full">{p}</span>
          ))}
        </div>

        {project.githubRepo && (
          <div className="flex items-center gap-3 pt-1 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Github size={14} />
              <span className="font-mono text-xs">{project.githubRepo}</span>
            </div>
            {repoMeta && (
              <>
                <span className="text-xs text-muted-foreground">브랜치: {repoMeta.defaultBranch}</span>
                {repoMeta.pushedAt && (
                  <span className="text-xs text-muted-foreground">
                    마지막 푸시: {new Date(repoMeta.pushedAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
                <a href={repoMeta.htmlUrl} target="_blank" rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  GitHub 열기 <ExternalLink size={10} />
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {/* README */}
      {project.githubRepo ? (
        loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 size={14} className="animate-spin" /> README 불러오는 중...
          </div>
        ) : readme ? (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-muted/40 border-b border-border text-sm font-medium">
              <Github size={14} />
              README.md
            </div>
            <div className="px-7 py-6 prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-semibold prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-pre:bg-muted prose-pre:rounded-lg prose-pre:text-xs
              prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground
              prose-ul:text-muted-foreground prose-ol:text-muted-foreground
              prose-table:text-sm prose-hr:border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            <FileText size={20} className="mx-auto mb-2 opacity-40" />
            README.md 파일이 없거나 불러올 수 없습니다.
          </div>
        )
      ) : (
        <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
          <Github size={20} className="mx-auto mb-2 opacity-40" />
          <p>GitHub 저장소가 연결되어 있지 않습니다.</p>
          <p className="text-xs mt-1">"Git에서 다시읽기" 버튼으로 연결하거나 프로젝트 설정에서 등록하세요.</p>
        </div>
      )}
    </div>
  )
}
