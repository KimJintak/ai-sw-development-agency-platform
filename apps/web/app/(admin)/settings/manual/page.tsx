'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  BookOpen,
  Network,
  KeyRound,
  Radio,
  Activity,
  AlertTriangle,
  Terminal,
  CheckCircle2,
} from 'lucide-react'

export default function OperatorManualPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('manual.back')}
        </Link>
        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
          <BookOpen size={22} className="text-primary" />
          운영자 매뉴얼 — 에이전트 연결
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          외부 Worker(Mac/Windows/AWS 등)를 플랫폼에 연결하고 Work Item을 처리하도록 구성하는 전체 절차를
          설명합니다.
        </p>
      </div>

      <Toc />

      <Section id="overview" icon={<Network size={18} />} title="1. 구성 개요">
        <p>
          본 플랫폼은 <b>API 서버(NestJS)</b>, <b>오케스트레이터(Elixir/Phoenix)</b>, 그리고{' '}
          <b>외부 에이전트(Worker)</b> 세 계층으로 동작합니다. 에이전트는 오케스트레이터의 Phoenix Channel에
          <b> WebSocket</b>으로 접속해 작업을 수신하고 진행 상황을 보고합니다.
        </p>
        <Diagram />
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            <b>AgentCard</b>: 에이전트 메타데이터(type, name, endpoint, skills, status)를 DB에 보관.
          </li>
          <li>
            <b>Task</b>: API를 통해 생성되어 오케스트레이터로 디스패치, 적합한 에이전트 채널에 라우팅됩니다.
          </li>
          <li>
            <b>Callback</b>: 에이전트가 보낸 <code>task:update</code> / <code>task:complete</code>는
            오케스트레이터가 API 서버의 <code>/internal/tasks/:id/...</code>로 전달합니다.
          </li>
        </ul>
      </Section>

      <Section id="prereq" icon={<KeyRound size={18} />} title="2. 사전 준비물">
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            <b>AgentCard 사전 등록</b> — <code>agentType</code>은 enum(CRM, PM, ARCHITECTURE, UX, MAC_DEV,
            WINDOWS_DEV, AWS_DEV, TEST, DEPLOY, REPORT, TRIAGE, QA) 중 하나이며 유일해야 합니다. 현재 UI에서
            동적 등록은 제공하지 않으므로 <code>prisma/seed.ts</code> 또는 DB에 사전 삽입합니다.
          </li>
          <li>
            <b>ORCHESTRATOR_SECRET</b> — 오케스트레이터 → API 내부 콜백용 Bearer 토큰. API 서버와
            오케스트레이터의 환경변수에 동일 값으로 세팅합니다.
          </li>
          <li>
            <b>네트워크</b> — 에이전트 호스트에서 <code>wss://orchestrator/socket/websocket</code>이
            연결되어야 합니다. 사내 프록시가 있다면 WebSocket Upgrade 허용 확인.
          </li>
          <li>
            <b>에이전트 베이스 SDK</b> — <code>agents/base</code>의 <code>AgentClient</code>를
            사용하면 하트비트·재접속·이벤트 시그니처를 직접 구현할 필요가 없습니다.
          </li>
        </ul>
      </Section>

      <Section id="register" icon={<Terminal size={18} />} title="3. 에이전트 등록 (DB Seed)">
        <p className="text-sm">
          <code>apps/api/prisma/seed.ts</code>에 다음 형태로 AgentCard 레코드를 추가한 뒤{' '}
          <code>pnpm --filter api prisma db seed</code>를 실행합니다.
        </p>
        <CodeBlock>{`await prisma.agentCard.upsert({
  where: { agentType: 'MAC_DEV' },
  update: {},
  create: {
    agentType: 'MAC_DEV',
    name: 'Mac Dev Worker #1',
    endpoint: 'worker-macdev-01',          // 식별자 (URL일 필요 없음)
    status: 'OFFLINE',
    skills: [
      {
        id: 'xcode.build',
        name: 'Xcode Build',
        description: 'iOS/macOS 프로젝트 빌드 및 아카이브 생성',
        inputSchema: {
          type: 'object',
          properties: {
            scheme: { type: 'string' },
            configuration: { type: 'string' },
          },
          required: ['scheme'],
        },
      },
    ],
  },
})`}</CodeBlock>
        <Callout>
          <b>skills</b>는 JSON 배열이며 각 항목의 <code>inputSchema</code>는 JSON Schema 형식입니다. PM Agent가
          Work Item을 생성할 때 이 스키마로 payload를 검증합니다.
        </Callout>
      </Section>

      <Section id="connect" icon={<Radio size={18} />} title="4. WebSocket 접속 및 채널 Join">
        <p className="text-sm">
          에이전트는 Phoenix Channel 프로토콜로 접속합니다. <code>agents/base/src/agent-client.ts</code>의{' '}
          <code>AgentClient</code>가 래핑을 제공합니다.
        </p>
        <CodeBlock>{`import { AgentClient } from '@agency/agent-base'

const client = new AgentClient({
  url: 'wss://orchestrator.example.com/socket/websocket',
  agentId: 'worker-macdev-01',
  agentType: 'MAC_DEV',
  secret: process.env.ORCHESTRATOR_SECRET!,
  heartbeatIntervalMs: 15000,
})

client.on('task:dispatch', async (task) => {
  // task = { id, taskType, payload, projectId, ... }
  await client.update(task.id, { progress: 0.1, message: '시작' })
  try {
    const result = await runTask(task)
    await client.complete(task.id, { success: true, result })
  } catch (err) {
    await client.complete(task.id, { success: false, error: String(err) })
  }
})

await client.connect()`}</CodeBlock>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            접속 URL: <code>/socket/websocket?agent_id=&lt;id&gt;&amp;agent_type=&lt;TYPE&gt;&amp;secret=&lt;SECRET&gt;</code>
          </li>
          <li>
            토픽: <code>agent:&lt;TYPE&gt;</code> (예: <code>agent:MAC_DEV</code>)
          </li>
          <li>Join 성공 시 AgentRegistry에 등록되고 AgentCard 상태가 <code>ONLINE</code>으로 갱신됩니다.</li>
        </ul>
      </Section>

      <Section id="events" icon={<Activity size={18} />} title="5. 이벤트 규약">
        <EventTable />
        <p className="text-sm">
          <b>payload 예시 — task:update</b>
        </p>
        <CodeBlock>{`{
  "task_id": "clx123...",
  "progress": 0.42,
  "message": "Archive 단계 진행 중",
  "metadata": { "stage": "archive" }
}`}</CodeBlock>
        <p className="text-sm">
          <b>payload 예시 — task:complete</b>
        </p>
        <CodeBlock>{`{
  "task_id": "clx123...",
  "success": true,
  "result": {
    "artifactUrl": "s3://artifacts/builds/abc.ipa",
    "size": 18234112
  },
  "error": null
}`}</CodeBlock>
      </Section>

      <Section id="lifecycle" icon={<CheckCircle2 size={18} />} title="6. 상태 전이 및 헬스체크">
        <StatusTable />
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>
            <b>Heartbeat</b>: 기본 15초 간격. AgentRegistry의 <code>touch()</code>가{' '}
            <code>lastSeenAt</code>을 갱신합니다.
          </li>
          <li>
            <b>Timeout</b>: 일정 시간 하트비트가 없으면 OFFLINE으로 전환되고, 할당된 Task는 재디스패치 대상이
            됩니다.
          </li>
          <li>
            <b>Stalled Radar</b>: Admin Ops 대시보드는 SUBMITTED/WORKING 상태에서 마지막{' '}
            <code>AGENT_UPDATE</code> ChatMessage 이후 15분을 초과한 Task를 정체로 표시합니다
            (<code>admin-ops.service.ts</code>).
          </li>
        </ul>
      </Section>

      <Section id="troubleshoot" icon={<AlertTriangle size={18} />} title="7. 문제 해결">
        <TroubleTable />
      </Section>

      <Section id="checklist" icon={<CheckCircle2 size={18} />} title="8. 배포 전 체크리스트">
        <ul className="space-y-1.5 text-sm">
          {[
            'AgentCard가 DB에 존재하고 agentType이 고유한가',
            'ORCHESTRATOR_SECRET이 API / 오케스트레이터 / 에이전트 3자에 동일하게 세팅되었는가',
            '에이전트 호스트에서 오케스트레이터 WS 엔드포인트로 접속 가능한가 (wscat 테스트 권장)',
            '샘플 Task를 생성해 task:dispatch → update → complete 사이클이 끝나는가',
            'Admin Ops → 에이전트 상태가 ONLINE으로 표시되는가',
            'Stalled radar가 정상 Task를 오탐하지 않는가',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-0.5 text-emerald-500 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function Toc() {
  const items = [
    ['overview', '1. 구성 개요'],
    ['prereq', '2. 사전 준비물'],
    ['register', '3. 에이전트 등록'],
    ['connect', '4. WebSocket 접속'],
    ['events', '5. 이벤트 규약'],
    ['lifecycle', '6. 상태 전이 / 헬스체크'],
    ['troubleshoot', '7. 문제 해결'],
    ['checklist', '8. 배포 전 체크리스트'],
  ]
  return (
    <nav className="rounded-lg border bg-muted/30 p-4">
      <div className="text-xs font-medium text-muted-foreground mb-2">목차</div>
      <ol className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {items.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} className="text-primary hover:underline">
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-lg border bg-card p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-2 text-base">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-md bg-muted/60 border p-3 text-xs overflow-x-auto font-mono leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border-l-2 border-primary/50 bg-primary/5 px-3 py-2 text-sm">
      {children}
    </div>
  )
}

function Diagram() {
  return (
    <pre className="rounded-md bg-muted/60 border p-3 text-[11px] overflow-x-auto font-mono leading-tight">
{`┌──────────┐   HTTPS    ┌───────────┐   HTTP(int)  ┌──────────────┐
│ Web UI   │──────────▶│  API (NestJS) │◀────────────│ Orchestrator │
└──────────┘           └───────────┘               │  (Phoenix)   │
                             ▲                      └──────┬───────┘
                             │ POST /internal/tasks/:id     │ WebSocket
                             │                              ▼
                                                    ┌──────────────┐
                                                    │ Agent Worker │
                                                    └──────────────┘`}
    </pre>
  )
}

function EventTable() {
  const rows = [
    ['phx_join', '에이전트 → OC', 'agent:<TYPE> 토픽 조인 (접속 최초 1회)'],
    ['heartbeat', '에이전트 → OC', '15초 주기. lastSeenAt 갱신'],
    ['task:dispatch', 'OC → 에이전트', '새 Task 할당. payload 포함'],
    ['task:update', '에이전트 → OC', '진행률·로그. ChatMessage(AGENT_UPDATE)로 저장'],
    ['task:complete', '에이전트 → OC', '성공/실패 + result. Task 상태 COMPLETED / FAILED'],
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border rounded-md">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-2 font-medium">이벤트</th>
            <th className="text-left px-3 py-2 font-medium">방향</th>
            <th className="text-left px-3 py-2 font-medium">설명</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([ev, dir, desc]) => (
            <tr key={ev} className="border-t">
              <td className="px-3 py-2 font-mono">{ev}</td>
              <td className="px-3 py-2 whitespace-nowrap">{dir}</td>
              <td className="px-3 py-2 text-muted-foreground">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusTable() {
  const rows: [string, string, string][] = [
    ['OFFLINE', 'bg-slate-500/15 text-slate-600 dark:text-slate-300', '미연결(기본값). 하트비트 중단 시 복귀'],
    ['ONLINE', 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', '채널 Join 성공 + 하트비트 정상'],
    ['BUSY', 'bg-amber-500/15 text-amber-600 dark:text-amber-400', '하나 이상의 Task 처리 중'],
    ['ERROR', 'bg-red-500/15 text-red-600 dark:text-red-400', '연속 실패/예외. 수동 점검 필요'],
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border rounded-md">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-2 font-medium">상태</th>
            <th className="text-left px-3 py-2 font-medium">의미</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([s, cls, desc]) => (
            <tr key={s} className="border-t">
              <td className="px-3 py-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{s}</span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TroubleTable() {
  const rows = [
    [
      '401 unauthorized (채널 Join 실패)',
      'ORCHESTRATOR_SECRET 불일치. 에이전트·오케스트레이터 모두 환경변수 확인.',
    ],
    [
      'agent_type_not_registered',
      'AgentCard에 해당 agentType이 없음. seed 재실행.',
    ],
    [
      '에이전트는 실행 중인데 ONLINE이 안 됨',
      'WebSocket Upgrade가 프록시에서 차단되었을 수 있음. wscat으로 직접 접속 테스트.',
    ],
    [
      'Task가 디스패치됐지만 응답 없음',
      '에이전트 측 task:dispatch 핸들러 오류. 컨테이너 로그 확인 + /internal/tasks 재시도 정책 점검.',
    ],
    [
      'Stalled radar에 계속 걸림',
      '장기 작업은 task:update를 주기적으로 호출해 하트비트 외 진행 신호를 남겨야 함.',
    ],
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border rounded-md">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-2 font-medium">증상</th>
            <th className="text-left px-3 py-2 font-medium">원인 / 조치</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([sym, fix]) => (
            <tr key={sym} className="border-t">
              <td className="px-3 py-2 font-medium">{sym}</td>
              <td className="px-3 py-2 text-muted-foreground">{fix}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
