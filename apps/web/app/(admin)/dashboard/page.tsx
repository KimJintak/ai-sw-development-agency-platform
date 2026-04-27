'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import apiClient from '@/lib/api-client'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  FolderKanban, Activity, Bot, CheckCircle2, TrendingUp, ArrowUpRight,
  Sparkles, Clock, MessageSquare, Rocket, FileText, AlertTriangle,
} from 'lucide-react'

interface DashboardStats {
  projects: { total: number; active: number }
  agents: { total: number; online: number }
  feedback: { unresolved: number; criticalOpen: number }
  releases: { thisWeek: number }
  requirements: { pendingApproval: number }
  tasks: { thisWeek: number }
  recentFeedback: {
    id: string; title: string; severity: string | null; type: string | null
    status: string; createdAt: string; workItemId: string | null
    project: { id: string; name: string }
  }[]
  recentReleases: {
    id: string; version: string; deployedAt: string | null; platforms: string[]
    project: { id: string; name: string }
  }[]
}

export default function DashboardPage() {
  const { t } = useI18n()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get<DashboardStats>('/api/dashboard/stats')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const criticalOpen = stats?.feedback?.criticalOpen ?? 0
  const pendingApproval = stats?.requirements?.pendingApproval ?? 0
  const activeProjects = stats?.projects?.active ?? 0
  const totalProjects = stats?.projects?.total ?? 0
  const agentsOnline = stats?.agents?.online ?? 0
  const agentsTotal = stats?.agents?.total
  const weekReleases = stats?.releases?.thisWeek ?? 0
  const unresolvedFeedback = stats?.feedback?.unresolved ?? 0
  const weekTasks = stats?.tasks?.thisWeek ?? 0
  const recentFeedback = stats?.recentFeedback ?? []
  const recentReleases = stats?.recentReleases ?? []

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Sparkles size={12} className="text-primary" />
            <span>{t('dashboard.welcome')}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Link
          href="/projects"
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
        >
          {t('dashboard.newProject')} <ArrowUpRight size={14} />
        </Link>
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FolderKanban size={18} />} label={t('dashboard.stat.totalProjects')}
          value={totalProjects} tone="blue" loading={loading} />
        <StatCard icon={<Activity size={18} />} label={t('dashboard.stat.activeProjects')}
          value={activeProjects} tone="emerald" loading={loading} />
        <StatCard icon={<Bot size={18} />} label={t('dashboard.stat.onlineAgents')}
          value={agentsOnline}
          delta={agentsTotal != null ? `/ ${agentsTotal}` : undefined}
          tone="violet" loading={loading} />
        <StatCard icon={<Rocket size={18} />} label="이번 주 배포"
          value={weekReleases} tone="amber" loading={loading} />
      </div>

      {/* Alert row */}
      {(criticalOpen > 0 || pendingApproval > 0) && !loading && (
        <div className="flex flex-wrap gap-3">
          {criticalOpen > 0 && (
            <Link href="/feedback"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 hover:opacity-90">
              <AlertTriangle size={14} />
              <span>P0/P1 미해결 피드백 <strong>{criticalOpen}건</strong></span>
            </Link>
          )}
          {pendingApproval > 0 && (
            <Link href="/projects"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400 hover:opacity-90">
              <FileText size={14} />
              <span>요구사항 승인 대기 <strong>{pendingApproval}건</strong></span>
            </Link>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <section className="bg-card border rounded-xl overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="font-semibold flex items-center gap-2"><MessageSquare size={14} /> 최근 피드백</h2>
              <p className="text-xs text-muted-foreground mt-0.5">이번 주 수신 {recentFeedback.length}건</p>
            </div>
            <Link href="/feedback" className="text-xs text-primary hover:underline">전체 보기 →</Link>
          </header>
          <ul className="divide-y">
            {loading ? <SkeletonRow /> : recentFeedback.length === 0 ? (
              <li className="p-8 text-center text-sm text-muted-foreground">이번 주 피드백 없음</li>
            ) : (
              recentFeedback.map((fb) => (
                <li key={fb.id}>
                  <Link href={`/projects/${fb.project.id}/feedback`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group">
                    <SeverityBadge severity={fb.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate group-hover:text-primary">{fb.title}</div>
                      <div className="text-xs text-muted-foreground">{fb.project.name}</div>
                    </div>
                    {fb.workItemId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">WI 생성됨</span>
                    )}
                    <StatusDot status={fb.status} />
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Recent Releases */}
        <section className="bg-card border rounded-xl overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="font-semibold flex items-center gap-2"><Rocket size={14} /> 최근 배포</h2>
              <p className="text-xs text-muted-foreground mt-0.5">배포 완료 릴리스</p>
            </div>
          </header>
          <ul className="divide-y">
            {loading ? <SkeletonRow /> : recentReleases.length === 0 ? (
              <li className="p-8 text-center text-sm text-muted-foreground">배포된 릴리스 없음</li>
            ) : (
              recentReleases.map((r) => (
                <li key={r.id}>
                  <Link href={`/projects/${r.project.id}/releases`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Rocket size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm group-hover:text-primary">{r.project.name} — {r.version}</div>
                      <div className="text-xs text-muted-foreground">{r.platforms.join(', ')}</div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {r.deployedAt
                        ? new Date(r.deployedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                        : '—'}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* Completion rate */}
      {stats && (
        <section className="bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 border rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{t('dashboard.completionRate')}</h3>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-green-500" /> 활성 {activeProjects}개</span>
                  <span className="flex items-center gap-1"><MessageSquare size={11} className="text-amber-500" /> 미해결 피드백 {unresolvedFeedback}건</span>
                  <span className="flex items-center gap-1"><Clock size={11} className="text-blue-500" /> 이번 주 태스크 {weekTasks}건</span>
                </div>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                  style={{
                    width: `${totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({
  icon, label, value, delta, tone, loading,
}: {
  icon: React.ReactNode; label: string; value: number; delta?: string
  tone: 'blue' | 'emerald' | 'violet' | 'amber'; loading?: boolean
}) {
  const tones = {
    blue: 'from-blue-500/10 to-blue-500/0 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    violet: 'from-violet-500/10 to-violet-500/0 text-violet-600 dark:text-violet-400 border-violet-500/20',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-400 border-amber-500/20',
  }
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${tones[tone]} bg-card p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="opacity-90">{icon}</span>
        {delta && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background/60">{delta}</span>}
      </div>
      <div className="text-3xl font-bold tracking-tight text-foreground">
        {loading ? <span className="inline-block h-8 w-12 bg-muted rounded animate-pulse" /> : value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string | null }) {
  const colors: Record<string, string> = {
    P0: 'bg-red-100 text-red-700', P1: 'bg-orange-100 text-orange-700',
    P2: 'bg-yellow-100 text-yellow-700', P3: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${colors[severity ?? 'P3'] ?? 'bg-muted'}`}>
      {severity ?? 'P3'}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'RESOLVED' ? 'bg-green-500' : status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-amber-500'
  return <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
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
