'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import type { Project } from 'shared-types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    apiClient.get('/api/projects').then((r) => setProjects(r.data))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90">
          New Project
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        {projects.length === 0 && (
          <p className="col-span-3 text-muted-foreground text-sm">No projects yet.</p>
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
