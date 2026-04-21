'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { useI18n } from '@/lib/i18n/i18n-context'
import type { Project } from 'shared-types'

interface Customer {
  id: string
  companyName: string
}

const PLATFORMS = ['MACOS', 'WINDOWS', 'IOS', 'ANDROID', 'WEB', 'LINUX'] as const

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

  useEffect(() => {
    apiClient.get('/api/projects').then((r) => setProjects(r.data)).catch(() => {})
  }, [])

  const openForm = () => {
    apiClient.get('/api/customers').then((r) => setCustomers(r.data)).catch(() => {})
    setShowForm(true)
  }

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  const submit = async () => {
    if (!name.trim() || !customerId || platforms.length === 0) return
    await apiClient.post('/api/projects', {
      name,
      description: description || undefined,
      customerId,
      platforms,
      githubRepo: githubRepo || undefined,
    })
    setName('')
    setDescription('')
    setCustomerId('')
    setPlatforms([])
    setGithubRepo('')
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
            <input
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="org/repo"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={submit}
              className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90"
            >
              Create Project
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
