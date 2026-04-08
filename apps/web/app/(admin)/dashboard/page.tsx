'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import type { Project, AgentCard } from 'shared-types'
import { ProjectStatus, AgentStatus } from 'shared-types'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [agents, setAgents] = useState<AgentCard[]>([])

  useEffect(() => {
    apiClient.get('/api/projects').then((r) => setProjects(r.data))
    apiClient.get('/api/agents').then((r) => setAgents(r.data))
  }, [])

  const active = projects.filter((p) => p.status === ProjectStatus.ACTIVE).length
  const online = agents.filter((a) => a.status === AgentStatus.ONLINE).length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={projects.length} />
        <StatCard label="Active Projects" value={active} />
        <StatCard label="Total Agents" value={agents.length} />
        <StatCard label="Online Agents" value={online} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-card rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Recent Projects</h2>
          {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
          <ul className="space-y-2">
            {projects.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.name}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-card rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Agent Status</h2>
          {agents.length === 0 && <p className="text-sm text-muted-foreground">No agents registered.</p>}
          <ul className="space-y-2">
            {agents.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span>{a.name}</span>
                <AgentBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    ON_HOLD: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100'}`}>
      {status}
    </span>
  )
}

function AgentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ONLINE: 'bg-green-100 text-green-700',
    BUSY: 'bg-yellow-100 text-yellow-700',
    OFFLINE: 'bg-gray-100 text-gray-500',
    ERROR: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100'}`}>
      {status}
    </span>
  )
}
