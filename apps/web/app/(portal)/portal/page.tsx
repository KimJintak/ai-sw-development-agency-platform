'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { FolderKanban, FileText, Package } from 'lucide-react'

interface PortalProject {
  id: string
  name: string
  status: string
  platforms: string[]
  createdAt: string
  _count: { workItems: number; releases: number; requirements: number }
}

export default function PortalHomePage() {
  const [projects, setProjects] = useState<PortalProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .get<PortalProject[]>('/api/portal/projects')
      .then((r) => setProjects(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-muted-foreground">불러오는 중...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 프로젝트</h1>
      {projects.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          아직 프로젝트가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/portal/${p.id}`}
              className="block border rounded-lg p-5 bg-card hover:border-primary transition-colors"
            >
              <h2 className="font-semibold text-lg mb-1">{p.name}</h2>
              <div className="text-xs text-muted-foreground mb-3">
                {p.platforms.join(', ')} · {p.status}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FolderKanban size={12} /> {p._count.workItems} items
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={12} /> {p._count.requirements} 요구사항
                </span>
                <span className="flex items-center gap-1">
                  <Package size={12} /> {p._count.releases} 릴리스
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
