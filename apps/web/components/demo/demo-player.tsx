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
  Bug,
  FlaskConical,
  Lightbulb,
  X,
  Code2,
} from 'lucide-react'
import { useEffect, useState } from 'react'

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
  const generatedCode = runner.activeSteps
    .map((s) => s.data as { generatedCode?: string; file?: string } | undefined)
    .find((d) => d?.generatedCode)
  const completed = runner.activeSteps.find((s) => s.kind === 'taskComplete')
  const bug = runner.activeSteps.find((s) => s.kind === 'bugReport')?.data as
    | { id: string; severity: string; title: string; stack: string }
    | undefined
  const autoFix = runner.activeSteps.find((s) => s.kind === 'autoFix')?.data as
    | { pr: number; diff: string }
    | undefined
  const reviewApproved = runner.activeSteps.find((s) => s.kind === 'reviewApproved')
  const testRuns = runner.activeSteps
    .filter((s) => s.kind === 'testRun')
    .map((s) => s.data as { platform: string; passed: number; total: number })
  const testReport = runner.activeSteps.find((s) => s.kind === 'testReport')?.data as
    | { coverage: number; newCoverage: number }
    | undefined

  const hasProjectFlow = project || requirements.length > 0 || design
  const hasBugFlow = bug || autoFix || reviewApproved
  const hasQaFlow = testRuns.length > 0 || testReport

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

      <CalloutOverlay step={runner.currentStep} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-4">
          {hasProjectFlow && (
            <>
              <Panel title="프로젝트" icon={<FolderPlus size={16} />} ready={!!project} highlight={runner.currentStep?.callout?.target === 'project'}>
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
                highlight={runner.currentStep?.callout?.target === 'requirements'}
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
                highlight={runner.currentStep?.callout?.target === 'design'}
              >
                {design ? (
                  <div className="bg-white rounded-md p-4 border">
                    <MermaidViewer code={design.mermaid} />
                  </div>
                ) : (
                  <Empty>요구사항이 수집되면 자동 생성됩니다.</Empty>
                )}
              </Panel>
            </>
          )}

          {generatedCode && (
            <Panel
              title={`에이전트 생성 코드 — ${generatedCode.file}`}
              icon={<Code2 size={16} />}
              ready
            >
              <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
                {generatedCode.generatedCode}
              </pre>
            </Panel>
          )}

          {hasBugFlow && (
            <Panel title="버그 & 자동 수정" icon={<Bug size={16} />} ready={!!bug} highlight={runner.currentStep?.callout?.target === 'bugs'}>
              {bug ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600">
                      {bug.id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 font-medium">
                      {bug.severity}
                    </span>
                    <span className="font-medium">{bug.title}</span>
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/40 p-2 rounded">
                    {bug.stack}
                  </pre>
                  {autoFix && (
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">
                          PR #{autoFix.pr}
                        </span>
                        {reviewApproved && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">
                            리뷰 승인됨
                          </span>
                        )}
                      </div>
                      <pre className="text-xs font-mono bg-muted/40 p-2 rounded whitespace-pre-wrap">
                        {autoFix.diff}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <Empty>버그 리포트 수신 대기 중.</Empty>
              )}
            </Panel>
          )}

          {hasQaFlow && (
            <Panel title="QA 실행" icon={<FlaskConical size={16} />} ready={testRuns.length > 0} highlight={runner.currentStep?.callout?.target === 'qa'}>
              <div className="space-y-3">
                {testRuns.map((r, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{r.platform}</span>
                      <span className="text-muted-foreground">
                        {r.passed} / {r.total}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(r.passed / r.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {testReport && (
                  <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">전체 커버리지</div>
                      <div className="font-bold text-lg">{testReport.coverage}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">신규 요구사항</div>
                      <div className="font-bold text-lg text-primary">
                        {testReport.newCoverage}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>

        <aside className="col-span-4 space-y-4">
          <Panel title="현재 진행" icon={<Info size={16} />}>
            <CurrentStep step={runner.currentStep} />
          </Panel>

          <Panel title="에이전트 활동" icon={<Activity size={16} />} ready={!!dispatched} highlight={runner.currentStep?.callout?.target === 'agent'}>
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
  highlight,
  children,
}: {
  title: string
  icon?: React.ReactNode
  ready?: boolean
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={`border rounded-lg bg-card transition-all ${
        highlight ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
    >
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

function CalloutOverlay({ step }: { step: DemoStep | null }) {
  const [dismissed, setDismissed] = useState<string | null>(null)

  useEffect(() => {
    setDismissed(null)
  }, [step?.callout?.message])

  if (!step?.callout) return null
  const key = `${step.at}-${step.callout.message}`
  if (dismissed === key) return null

  return (
    <div className="fixed bottom-6 right-6 max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-xl p-4 flex items-start gap-3">
        <Lightbulb size={18} className="shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <div className="font-medium mb-1">{step.title}</div>
          <div className="opacity-90 text-xs leading-relaxed">
            {step.callout.message}
          </div>
        </div>
        <button
          onClick={() => setDismissed(key)}
          className="shrink-0 opacity-70 hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
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
