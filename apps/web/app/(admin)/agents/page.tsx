'use client'

import { useEffect, useState, useCallback } from 'react'
import apiClient from '@/lib/api-client'
import { Cpu, HardDrive, MemoryStick, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface AgentCard {
  id: string
  agentType: string
  name: string
  description?: string | null
  endpoint: string
  skills: unknown
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR'
  lastSeenAt?: string | null
  // FR-05-09 메트릭
  cpuUsage?: number | null
  memUsage?: number | null
  diskUsage?: number | null
}

interface AgentTask {
  id: string
  taskType: string
  status: 'SUBMITTED' | 'WORKING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  agentCard: { id: string; agentType: string; name: string }
}

const statusColors: Record<string, string> = {
  ONLINE: 'text-green-600 bg-green-50 dark:bg-green-950/40',
  OFFLINE: 'text-gray-500 bg-gray-50 dark:bg-gray-800/40',
  BUSY: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40',
  ERROR: 'text-red-600 bg-red-50 dark:bg-red-950/40',
  SUBMITTED: 'text-blue-600 bg-blue-50',
  WORKING: 'text-yellow-600 bg-yellow-50',
  COMPLETED: 'text-green-600 bg-green-50',
  FAILED: 'text-red-600 bg-red-50',
}

function MetricBar({ value, label, icon, warn, danger }: {
  value: number | null | undefined
  label: string
  icon: React.ReactNode
  warn?: number
  danger?: number
}) {
  if (value == null) return null
  const pct = Math.min(100, Math.max(0, value))
  const color =
    danger != null && pct >= danger ? 'bg-red-500' :
    warn != null && pct >= warn ? 'bg-amber-500' :
    'bg-emerald-500'

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">{icon}{label}</span>
        <span className="font-mono tabular-nums">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const [cards, setCards] = useState<AgentCard[]>([])
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    setRefreshing(true)
    Promise.all([
      apiClient.get<AgentCard[]>('/api/agents').then((r) => setCards(r.data)),
      apiClient.get<AgentTask[]>('/api/agents/tasks/list').then((r) => setTasks(r.data)),
    ]).finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [load])

  const onlineCount = cards.filter((c) => c.status === 'ONLINE' || c.status === 'BUSY').length

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">에이전트 모니터</h1>
          <p className="text-sm text-muted-foreground mt-1">
            등록된 에이전트 카드, 실시간 장비 메트릭, 최근 태스크 현황
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border rounded-xl p-4 bg-card">
          <div className="text-xs text-muted-foreground">전체 에이전트</div>
          <div className="text-3xl font-bold">{cards.length}</div>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Wifi size={11} /> 온라인</div>
          <div className="text-3xl font-bold text-emerald-600">{onlineCount}</div>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><WifiOff size={11} /> 오프라인</div>
          <div className="text-3xl font-bold text-muted-foreground">{cards.length - onlineCount}</div>
        </div>
      </div>

      {/* 에이전트 카드 + 메트릭 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">에이전트 카드 ({cards.length})</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.id} className="bg-card border rounded-xl p-4 space-y-3">
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

              {/* FR-05-09 메트릭 */}
              {(c.cpuUsage != null || c.memUsage != null || c.diskUsage != null) ? (
                <div className="border-t pt-3 space-y-2">
                  <MetricBar value={c.cpuUsage} label="CPU" icon={<Cpu size={10} />} warn={70} danger={90} />
                  <MetricBar value={c.memUsage} label="메모리" icon={<MemoryStick size={10} />} warn={80} danger={95} />
                  <MetricBar value={c.diskUsage} label="디스크" icon={<HardDrive size={10} />} warn={80} danger={95} />
                </div>
              ) : (
                <div className="border-t pt-3 text-[10px] text-muted-foreground italic">
                  메트릭 없음 — 에이전트 heartbeat 대기 중
                </div>
              )}

              {c.lastSeenAt && (
                <div className="text-[10px] text-muted-foreground">
                  마지막 응답: {new Date(c.lastSeenAt).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          ))}
          {cards.length === 0 && (
            <p className="col-span-3 text-sm text-muted-foreground">등록된 에이전트 없음.</p>
          )}
        </div>
      </section>

      {/* 태스크 목록 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">최근 태스크 ({tasks.length})</h2>
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium text-xs">Task ID</th>
                <th className="px-4 py-2.5 font-medium text-xs">에이전트</th>
                <th className="px-4 py-2.5 font-medium text-xs">Type</th>
                <th className="px-4 py-2.5 font-medium text-xs">Status</th>
                <th className="px-4 py-2.5 font-medium text-xs">생성</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-2 font-mono text-xs">{t.id.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-xs">{t.agentCard.name}</td>
                  <td className="px-4 py-2 text-xs">{t.taskType}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={5}>
                    태스크 없음.
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
