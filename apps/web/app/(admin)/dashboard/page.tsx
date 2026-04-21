'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { useI18n } from '@/lib/i18n/i18n-context'
import type { Project, AgentCard } from 'shared-types'
import { ProjectStatus, AgentStatus } from 'shared-types'
import {
  FolderKanban,
  Activity,
  Bot,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Clock,
} from 'lucide-react'

export default function DashboardPage() {
  const { t } = useI18n()
  const [projects, setProjects] = useState<Project[]>([])
  const [agents, setAgents] = useState<AgentCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/projects').then((r) => setProjects(r.data)),
      apiClient.get('/api/agents').then((r) => setAgents(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const active = projects.filter((p) => p.status === ProjectStatus.ACTIVE).length
  const online = agents.filter((a) => a.status === AgentStatus.ONLINE).length
  const completionRate =
    projects.length > 0
      ? Math.round(
          (projects.filter((p) => p.status === ProjectStatus.COMPLETED).length / projects.length) *
            100,
        )
      : 0

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Sparkles size={12} className="text-primary" />
            <span>{t('dashboard.welcome')}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <Link
          href="/projects"
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
        >
          {t('dashboard.newProject')} <ArrowUpRight size={14} />
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban size={18} />}
          label={t('dashboard.stat.totalProjects')}
          value={projects.length}
          tone="blue"
          loading={loading}
        />
        <StatCard
          icon={<Activity size={18} />}
          label={t('dashboard.stat.activeProjects')}
          value={active}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          icon={<Bot size={18} />}
          label={t('dashboard.stat.totalAgents')}
          value={agents.length}
          tone="violet"
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label={t('dashboard.stat.onlineAgents')}
          value={online}
          delta={agents.length > 0 ? `${Math.round((online / agents.length) * 100)}%` : '0%'}
          tone="amber"
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold">{t('dashboard.recentProjects')}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.recentProjectsDesc')}</p>
            </div>
            <Link href="/projects" className="text-xs text-primary hover:underline">
              {t('dashboard.viewAll')} →
            </Link>
          </header>
          <ul className="divide-y divide-border">
            {loading ? (
              <SkeletonRow />
            ) : projects.length === 0 ? (
              <li className="p-8 text-center text-sm text-muted-foreground">
                {t('dashboard.noProjects')}
              </li>
            ) : (
              projects.slice(0, 6).map((p) => <ProjectRow key={p.id} p={p} />)
            )}
          </ul>
        </section>

        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">{t('dashboard.agentStatus')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {online} / {agents.length} {t('dashboard.online')}
            </p>
          </header>
          <ul className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {loading ? (
              <SkeletonRow />
            ) : agents.length === 0 ? (
              <li className="p-8 text-center text-sm text-muted-foreground">
                {t('dashboard.noAgents')}
              </li>
            ) : (
              agents.map((a) => <AgentRow key={a.id} a={a} />)
            )}
          </ul>
        </section>
      </div>

      <section className="bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{t('dashboard.completionRate')} {completionRate}%</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('dashboard.completionDetail')
                .replace('{total}', String(projects.length))
                .replace('{done}', String(projects.filter((p) => p.status === ProjectStatus.COMPLETED).length))}
            </p>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  delta,
  tone,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  delta?: string
  tone: 'blue' | 'emerald' | 'violet' | 'amber'
  loading?: boolean
}) {
  const tones = {
    blue: 'from-blue-500/10 to-blue-500/0 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald:
      'from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    violet:
      'from-violet-500/10 to-violet-500/0 text-violet-600 dark:text-violet-400 border-violet-500/20',
    amber:
      'from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-400 border-amber-500/20',
  }
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${tones[tone]} bg-card p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="opacity-90">{icon}</span>
        {delta && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background/60 text-foreground">
            {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold tracking-tight text-foreground">
        {loading ? <span className="inline-block h-8 w-12 bg-muted rounded animate-pulse" /> : value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function ProjectRow({ p }: { p: Project }) {
  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    COMPLETED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    ON_HOLD: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    ARCHIVED: 'bg-slate-500/10 text-muted-foreground',
  }
  return (
    <li>
      <Link
        href={`/projects/${p.id}`}
        className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate group-hover:text-primary transition-colors">
            {p.name}
          </div>
          {p.description && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">{p.description}</div>
          )}
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
            statusColor[p.status] ?? 'bg-muted'
          }`}
        >
          {p.status}
        </span>
      </Link>
    </li>
  )
}

function AgentRow({ a }: { a: AgentCard }) {
  const isOnline = a.status === AgentStatus.ONLINE
  return (
    <li className="flex items-center justify-between px-5 py-3 text-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${
            isOnline
              ? 'bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50'
              : 'bg-muted-foreground/40'
          }`}
        />
        <div className="min-w-0">
          <div className="font-medium truncate">{a.name}</div>
          <div className="text-[10px] text-muted-foreground">{a.agentType}</div>
        </div>
      </div>
      <span
        className={`text-[10px] flex items-center gap-1 ${
          isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
        }`}
      >
        {!isOnline && <Clock size={10} />}
        {a.status}
      </span>
    </li>
  )
}

function SkeletonRow() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <li key={i} className="px-5 py-3.5">
          <div className="h-4 bg-muted rounded animate-pulse w-3/5 mb-1.5" />
          <div className="h-3 bg-muted/60 rounded animate-pulse w-2/5" />
        </li>
      ))}
    </>
  )
}
