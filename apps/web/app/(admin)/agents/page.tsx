'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'

interface AgentCard {
  id: string
  agentType: string
  name: string
  description?: string | null
  endpoint: string
  skills: unknown
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR'
  lastSeenAt?: string | null
}

interface AgentTask {
  id: string
  taskType: string
  status: 'SUBMITTED' | 'WORKING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  agentCard: { id: string; agentType: string; name: string }
}

const statusColors: Record<string, string> = {
  ONLINE: 'text-green-600 bg-green-50',
  OFFLINE: 'text-gray-500 bg-gray-50',
  BUSY: 'text-yellow-600 bg-yellow-50',
  ERROR: 'text-red-600 bg-red-50',
  SUBMITTED: 'text-blue-600 bg-blue-50',
  WORKING: 'text-yellow-600 bg-yellow-50',
  COMPLETED: 'text-green-600 bg-green-50',
  FAILED: 'text-red-600 bg-red-50',
}

export default function AgentsPage() {
  const [cards, setCards] = useState<AgentCard[]>([])
  const [tasks, setTasks] = useState<AgentTask[]>([])

  useEffect(() => {
    apiClient.get('/api/agents').then((r) => setCards(r.data))
    apiClient.get('/api/agents/tasks/list').then((r) => setTasks(r.data))
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Agent cards registered in the orchestrator and recent tasks.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Agent Cards ({cards.length})</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.id} className="bg-card border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.agentType}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>
                  {c.status}
                </span>
              </div>
              {c.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              )}
              <p className="text-xs text-muted-foreground font-mono truncate">{c.endpoint}</p>
            </div>
          ))}
          {cards.length === 0 && (
            <p className="col-span-3 text-sm text-muted-foreground">No agent cards registered.</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Tasks ({tasks.length})</h2>
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Task ID</th>
                <th className="px-4 py-2 font-medium">Agent</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{t.id.slice(0, 8)}</td>
                  <td className="px-4 py-2">{t.agentCard.name}</td>
                  <td className="px-4 py-2">{t.taskType}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={5}>
                    No tasks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
