'use client'

import { useDemoRunner } from '@/lib/demo/use-demo-runner'
import type { DemoScenario, DemoStep } from '@/lib/demo/scenarios'
import { MermaidViewer } from '@/components/design/mermaid-viewer'
import {
  Play,
  Pause,
  RotateCcw,
  FolderPlus,
  FileText,
  GitBranch,
  Send,
  Activity,
  CheckCircle2,
  Info,
} from 'lucide-react'

export function DemoPlayer({ scenario }: { scenario: DemoScenario }) {
  const runner = useDemoRunner(scenario)

  const project = runner.activeSteps.find((s) => s.kind === 'createProject')?.data as
    | { name: string; customer: string; platforms: string[]; repo: string }
    | undefined
  const requirements = runner.activeSteps
    .filter((s) => s.kind === 'addRequirement')
    .map((s) => s.data as { id: string; title: string; text: string })
  const design = runner.activeSteps.find((s) => s.kind === 'generateDesign')?.data as
    | { type: string; mermaid: string }
    | undefined
  const dispatched = runner.activeSteps.find((s) => s.kind === 'dispatchTask')
  const agentUpdate = runner.activeSteps.find((s) => s.kind === 'agentUpdate')
  const completed = runner.activeSteps.find((s) => s.kind === 'taskComplete')

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">DEMO TOUR</div>
          <h1 className="text-2xl font-bold">{scenario.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{scenario.summary}</p>
        </div>
        <Controls runner={runner} />
      </header>

      <ProgressBar runner={runner} scenario={scenario} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-4">
          <Panel title="프로젝트" icon={<FolderPlus size={16} />} ready={!!project}>
            {project ? (
              <div className="space-y-2 text-sm">
                <Row label="이름" value={project.name} />
                <Row label="고객사" value={project.customer} />
                <Row label="플랫폼" value={project.platforms.join(', ')} />
                <Row label="레포" value={project.repo} />
              </div>
            ) : (
              <Empty>아직 프로젝트가 없습니다.</Empty>
            )}
          </Panel>

          <Panel
            title={`요구사항 (${requirements.length})`}
            icon={<FileText size={16} />}
            ready={requirements.length > 0}
          >
            {requirements.length === 0 ? (
              <Empty>요구사항 입력 대기 중.</Empty>
            ) : (
              <div className="space-y-3">
                {requirements.map((r) => (
                  <div key={r.id} className="border rounded-md p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {r.id}
                      </span>
                      <span className="font-medium text-sm">{r.title}</span>
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                      {r.text}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="설계 — 아키텍처 다이어그램"
            icon={<GitBranch size={16} />}
            ready={!!design}
          >
            {design ? (
              <div className="bg-white rounded-md p-4 border">
                <MermaidViewer code={design.mermaid} />
              </div>
            ) : (
              <Empty>요구사항이 수집되면 자동 생성됩니다.</Empty>
            )}
          </Panel>
        </div>

        <aside className="col-span-4 space-y-4">
          <Panel title="현재 진행" icon={<Info size={16} />}>
            <CurrentStep step={runner.currentStep} />
          </Panel>

          <Panel title="에이전트 활동" icon={<Activity size={16} />} ready={!!dispatched}>
            <div className="space-y-2 text-sm">
              {dispatched && (
                <LogLine icon={<Send size={12} />} tone="blue">
                  <strong>dispatch</strong> → MAC_DEV
                  <div className="text-xs text-muted-foreground">
                    code_generation · REQ-001
                  </div>
                </LogLine>
              )}
              {agentUpdate && (
                <LogLine icon={<Activity size={12} />} tone="amber">
                  <strong>task:update</strong>
                  <div className="text-xs text-muted-foreground">
                    LoginView.swift 생성 중...
                  </div>
                </LogLine>
              )}
              {completed && (
                <LogLine icon={<CheckCircle2 size={12} />} tone="green">
                  <strong>task:complete</strong>
                  <div className="text-xs text-muted-foreground">
                    PR 열림 · QA 테스트 케이스 생성
                  </div>
                </LogLine>
              )}
              {!dispatched && <Empty>대기 중.</Empty>}
            </div>
          </Panel>

          <Timeline runner={runner} scenario={scenario} />
        </aside>
      </div>
    </div>
  )
}

function Controls({ runner }: { runner: ReturnType<typeof useDemoRunner> }) {
  const isPlaying = runner.playState === 'playing'
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isPlaying ? runner.pause : runner.play}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        {isPlaying ? '일시정지' : runner.playState === 'finished' ? '다시재생' : '재생'}
      </button>
      <button
        onClick={runner.reset}
        className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-muted"
      >
        <RotateCcw size={14} />
      </button>
      <select
        value={runner.speed}
        onChange={(e) => runner.setSpeed(Number(e.target.value))}
        className="px-2 py-2 rounded-md border text-sm bg-background"
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={2}>2x</option>
        <option value={4}>4x</option>
      </select>
    </div>
  )
}

function ProgressBar({
  runner,
  scenario,
}: {
  runner: ReturnType<typeof useDemoRunner>
  scenario: DemoScenario
}) {
  return (
    <div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-[width] duration-150"
          style={{ width: `${runner.progress * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{(runner.elapsed / 1000).toFixed(1)}s</span>
        <span>{(scenario.durationMs / 1000).toFixed(0)}s</span>
      </div>
    </div>
  )
}

function Timeline({
  runner,
  scenario,
}: {
  runner: ReturnType<typeof useDemoRunner>
  scenario: DemoScenario
}) {
  return (
    <Panel title="타임라인">
      <ol className="space-y-2">
        {scenario.steps.map((step, i) => {
          const done = step.at <= runner.elapsed
          const active = runner.currentStep === step
          return (
            <li
              key={i}
              onClick={() => runner.seek(step.at)}
              className={`flex items-start gap-2 text-xs cursor-pointer p-2 rounded ${
                active ? 'bg-primary/10' : done ? 'opacity-60' : 'opacity-40'
              } hover:bg-muted`}
            >
              <span
                className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                  done ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{step.title}</div>
                <div className="text-muted-foreground">
                  {(step.at / 1000).toFixed(1)}s
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}

function CurrentStep({ step }: { step: DemoStep | null }) {
  if (!step) {
    return <Empty>재생 버튼을 눌러 시작하세요.</Empty>
  }
  return (
    <div className="space-y-1">
      <div className="font-medium text-sm">{step.title}</div>
      {step.detail && (
        <div className="text-xs text-muted-foreground">{step.detail}</div>
      )}
    </div>
  )
}

function Panel({
  title,
  icon,
  ready,
  children,
}: {
  title: string
  icon?: React.ReactNode
  ready?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="border rounded-lg bg-card">
      <header className="flex items-center gap-2 px-4 py-2.5 border-b text-sm font-medium">
        {icon}
        <span>{title}</span>
        {ready && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-600">
            active
          </span>
        )}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-20 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground italic">{children}</div>
}

function LogLine({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode
  tone: 'blue' | 'amber' | 'green'
  children: React.ReactNode
}) {
  const toneCls = {
    blue: 'bg-blue-500/10 text-blue-600',
    amber: 'bg-amber-500/10 text-amber-600',
    green: 'bg-green-500/10 text-green-600',
  }[tone]
  return (
    <div className="flex items-start gap-2">
      <div className={`p-1 rounded ${toneCls}`}>{icon}</div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
