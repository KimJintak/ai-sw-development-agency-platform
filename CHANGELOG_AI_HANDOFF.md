# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.4.0] — 2026-04-09

### Phase 3 — Orchestrator↔API integration closure + Agents module

#### Added
- **`AgentsModule`** (`apps/api/src/agents/`)
  - `AgentsService` — Prisma-backed CRUD over `AgentCard` / `AgentTask`
    with `listCards`, `findCard`, `listTasks` (filter by projectId /
    status / agentType), `findTask`, `createTask`, `applyUpdate`,
    `markComplete`.
  - `AgentsController` (JWT-guarded) — `GET /api/agents`,
    `GET /api/agents/tasks/list`, `GET /api/agents/tasks/:taskId`,
    `POST /api/agents/tasks`, `GET /api/agents/:id`. Route declaration
    order is deliberate — `tasks/*` must precede `:id` so the static
    segment isn't shadowed.
  - `InternalTasksController` (OrchestratorAuthGuard) —
    `POST /internal/tasks/:id/updates` and `POST /internal/tasks/:id/complete`.
    These are the Phase 2 Orchestrator's `TaskCallback` sinks.
  - DTOs: `CreateAgentTaskDto`, `TaskUpdateDto`, `TaskCompleteDto`,
    `ListAgentTasksQuery`. `projectId` is required on
    `CreateAgentTaskDto` because the Orchestrator's RedisConsumer
    pattern-matches on it for per-project dispatch.
- **`OrchestratorAuthGuard`** (`apps/api/src/common/guards/`) —
  verifies `Authorization: Bearer ${ORCHESTRATOR_SECRET}` with
  `crypto.timingSafeEqual`; throws `UnauthorizedException` on any
  mismatch or if the secret is unconfigured.
- **`RedisModule` / `RedisService`** (`apps/api/src/common/redis/`) —
  `@Global` ioredis wrapper exposing `publishTask(entry)` which XADDs
  to the `orchestrator:tasks` stream. Wire format matches the
  Orchestrator's `RedisConsumer` exactly: top-level `project_id` +
  `task_id` + `payload` JSON. Routing fields (`task_id`, `agent_type`,
  `task_type`) are folded into the payload JSON because
  `RedisConsumer` forwards only `payload` to
  `ProjectOrchestrator.enqueue_task/2`.
- **`app.module.ts`** imports `RedisModule` (global) and `AgentsModule`.
- **Admin UI — `/agents` page** (`apps/web/app/(admin)/agents/page.tsx`)
  — client component that lists agent cards (name / type / status /
  endpoint) and a recent-tasks table. Uses the existing
  `apiClient` with auto-injected JWT.

#### Changed
- `CreateAgentTaskDto.projectId` is now **required**. Tasks without a
  `project_id` would otherwise be silently dropped by the
  Orchestrator's RedisConsumer (`with %{"project_id" => _, ...}`).
- `AgentsService.createTask` writes `errorLog: "redis_publish_failed: ..."`
  and returns the updated row when XADD fails, so a future outbox
  worker can identify and retry the task.
- `AgentsService.applyUpdate` guards the JSON merge: `result` is only
  spread when the existing value is a plain object (not array /
  primitive), preventing runtime crashes on historical data.

#### Known limitations (Phase 3.5 / Phase 4 follow-up)
- No outbox worker yet — failed `XADD` calls are logged and marked on
  the row, but nothing retries them automatically.
- `applyUpdate` is non-atomic (read-merge-write). Two concurrent
  updates on the same task can lose telemetry. Fix by moving the
  JSON merge into a single `UPDATE ... jsonb_set` call.
- `npm install` not executed here — `ioredis` was already declared in
  `apps/api/package.json`, so no new dependencies. Run
  `cd apps/api && npm install && npm run build` locally to verify.
- The Admin UI has no error handling for API failures (unauthenticated
  requests show an empty state).

---

## [0.3.0] — 2026-04-09

### Phase 2 — Orchestrator skeleton

#### Added
- **Phoenix Orchestrator OTP tree** (`apps/orchestrator/lib/`)
  - `Orchestrator.AgentRegistry` — GenServer tracking online agents by `agent_type`;
    uses `Process.monitor` to auto-evict on channel crash; `touch/1` for heartbeats.
  - `Orchestrator.ProjectSupervisor` — `DynamicSupervisor` for per-project
    orchestrator processes (failure isolation between projects).
  - `Orchestrator.ProjectOrchestrator` — per-project `GenServer` registered via
    `{:via, Registry, …}` in `Orchestrator.ProjectRegistry`; holds in-flight task
    state and forwards to dispatcher.
  - `Orchestrator.RedisConsumer` — `XREADGROUP` loop on `orchestrator:tasks`
    stream (consumer group `orchestrator`); lazy-starts missing
    `ProjectOrchestrator` processes; XACKs handled/unprocessable entries.
  - `Orchestrator.TaskDispatcher` — round-robin dispatcher selecting an agent
    of the required `agent_type` from `AgentRegistry` and sending
    `{:dispatch_task, payload}` to the channel pid.
  - `Orchestrator.HeartbeatMonitor` — 10s tick, unregisters agents whose
    `last_seen` is older than 30s.
- **Phoenix web layer** (`apps/orchestrator/lib/orchestrator_web/`)
  - `OrchestratorWeb.HealthController` (`GET /health`) — reports agents online
    and running projects count.
  - `OrchestratorWeb.OrchestrationController` — `POST /api/orchestrate/:project_id/{start,stop}`,
    `GET /api/orchestrate/:project_id/status`, `POST /api/agents/register`.
  - `OrchestratorWeb.ErrorJSON` — referenced from `config.exs`.
  - `OrchestratorWeb.AgentChannel` (`agent:<agent_id>` topic) — on join,
    registers the channel pid in `AgentRegistry`; handles `heartbeat`,
    `task:update`, `task:complete`; pushes `task:dispatch` events from
    dispatcher.
- **Application supervision tree** (`application.ex`): added
  `{Registry, keys: :unique, name: Orchestrator.ProjectRegistry}` to support
  via-tuple lookup of `ProjectOrchestrator` processes, and
  `{Task.Supervisor, name: Orchestrator.TaskSupervisor}` for async HTTP
  callbacks.
- **`Orchestrator.TaskCallback`** (`lib/orchestrator/task_callback.ex`) —
  forwards `task:update` / `task:complete` events from agents to the API
  server via `Req.post/2` running under `Orchestrator.TaskSupervisor`
  (fire-and-forget, 5s timeout). Posts to
  `POST {api_url}/internal/tasks/:task_id/updates` and
  `POST .../complete` with `Authorization: Bearer {orchestrator_secret}`.
  Failures log only — retries deferred to Phase 3 outbox.
- **`AgentChannel`** now calls `TaskCallback.report_update/3` and
  `report_complete/3` instead of only logging.
- **`OrchestrationController.register_agent`** returns 202 Accepted with
  `canonical_path: "/socket/websocket"` and a note that real registration
  happens on WebSocket join.
- **Integration test skeletons** (`@moduletag :integration` / `:redis`,
  excluded from default runs):
  - `test/support/channel_case.ex`, `test/support/conn_case.ex` —
    standard Phoenix test case templates.
  - `test/orchestrator_web/agent_channel_test.exs` — join, heartbeat,
    task:update/complete, dispatch routing.
  - `test/orchestrator_web/orchestration_controller_test.exs` —
    start/stop/status/register endpoints + AuthPlug check.
  - `test/orchestrator/redis_consumer_test.exs` — XADD/XREADGROUP/XACK
    flow (requires live Redis).
  Tests are marked `:skip` pending real fixture wiring; stubs document
  expected assertions so Phase 3 can fill them in.

#### Tests (unit, no external deps)
| Test file | Target module | SRS FR |
|---|---|---|
| `test/orchestrator/agent_registry_test.exs` | `AgentRegistry` | FR-04-08, FR-05-01 |
| `test/orchestrator/task_dispatcher_test.exs` | `TaskDispatcher` | FR-04-01 |
| `test/orchestrator/project_supervisor_test.exs` | `ProjectSupervisor`, `ProjectOrchestrator` | FR-04-09 |
| `test/orchestrator/heartbeat_monitor_test.exs` | `HeartbeatMonitor` | FR-04-08 |

Coverage highlights:
- Register/lookup/unregister, per-type listing, heartbeat touch,
  automatic cleanup on channel-pid `:DOWN`.
- Round-robin dispatch across N agents, no-agent fallback, default
  `agent_type` handling.
- Per-project supervision: start, duplicate rejection, stop, failure
  isolation between projects, status snapshot.
- Heartbeat sweep: stale eviction, fresh retention via `touch/1`.

#### Changed
- `HeartbeatMonitor` now accepts `:interval_ms` and `:timeout_seconds`
  options (defaults unchanged at 10s / 30s); added synchronous
  `sweep/1` so tests can exercise eviction without waiting for the
  scheduled tick.
- `mix.exs` test alias no longer runs `ecto.create`/`ecto.migrate`, so
  the unit suite runs without Postgres. A separate integration alias
  will be added when DB-backed tests arrive.
- `test/test_helper.exs` stops `:orchestrator` before `ExUnit.start/0`
  so tests own their supervision via `start_supervised!`, avoiding
  conflicts with auto-started singletons (`AgentRegistry`, etc.). Now
  excludes `:integration`, `:redis`, and `:skip` tags by default. Run
  integration tests with `mix test --include integration` (requires
  Phoenix Endpoint + AgentRegistry booted).
- `mix.exs` version bumped `0.1.0` → `0.3.0` to match the release.
- `config/config.exs` declares default `:api_url` / `:orchestrator_secret`;
  env-specific values are supplied by `dev.exs` / `prod.exs` (`API_URL` /
  `ORCHESTRATOR_SECRET`).

#### Known limitations (Phase 3 follow-up)
- TaskCallback has no retry / dead-letter queue — failed callbacks are
  logged and dropped. Phase 3 introduces an outbox pattern.
- The API side (`POST /internal/tasks/:id/updates` and `/complete`) is
  not yet implemented; API returns 404 until Phase 3 adds these routes.
- `mix test` / `mix compile` not executed in this environment (Elixir
  toolchain absent). Run
  `cd apps/orchestrator && mix deps.get && mix test` locally to verify.
- Integration test bodies are `:skip`-tagged placeholders; real
  assertions require Phoenix Endpoint fixtures + `Req.Test` stubs.

---

## [0.2.0] — 2026-04-08

### Phase 1 — Authentication, CRM & Project Management

#### Glossary
| Term | Definition |
|------|------------|
| **Work Item** | A development unit in Epic → Story → Task hierarchy |
| **Orchestrator** | Phoenix GenServer that coordinates agent workflows |
| **A2A** | Agent-to-Agent Protocol — standard inter-agent communication |
| **MCP** | Model Context Protocol — connects agents to external tools |
| **Agent Card** | JSON document declaring an agent's skills and endpoint |
| **DSL** | Domain-Specific Language — JSON grammar for orchestration config |
| **Triage** | Process of classifying incoming feedback by type and severity |
| **Feature File** | Cucumber BDD requirement specification file (.feature) |

#### Added
- **Prisma schema** (`apps/api/prisma/schema.prisma`): Full entity definitions
  - Auth: `User`, `PortalUser`
  - CRM: `Customer`, `Opportunity`, `Contract`
  - Project: `Project`, `ProjectMember`
  - Work Items: `WorkItem`, `WorkItemDependency`, `TaskEstimation`
  - Requirements: `Requirement`, `RequirementVersion`, `RequirementLink`
  - Design: `DesignArtifact`, `DesignArtifactVersion`
  - QA: `TestCase`, `TestRun`, `TestResult`
  - Releases: `Release`, `ReleaseItem`, `Build`
  - Agents: `AgentCard`, `AgentTask`
  - Feedback: `Feedback` (with pgvector embedding field)
- **Prisma seed** (`apps/api/prisma/seed.ts`): Admin/PM users + all 12 agent cards
- **NestJS common layer**:
  - `PrismaService` / `PrismaModule` (global)
  - `JwtAuthGuard`, `RolesGuard`
  - `@CurrentUser()`, `@Roles()` decorators
  - `HttpExceptionFilter`, `AllExceptionsFilter`
- **Auth module**: JWT login, refresh token, `/api/auth/me`
- **CRM module**: Customers, Opportunities (pipeline stage), Contracts CRUD
- **Projects module**: CRUD + progress endpoint + orchestration DSL update
- **Work Items module**: Hierarchical CRUD (Epic→Story→Task) + Kanban status update
- **`main.ts`**: Swagger, CORS, ValidationPipe, global filters
- **Admin UI — Login page** (`apps/web/app/(auth)/login/page.tsx`)
- **Admin UI — Sidebar** with route highlighting
- **Admin UI — Dashboard**: project/agent summary stats
- **Admin UI — CRM page**: customer table + sales pipeline (Kanban by stage)
- **Admin UI — Projects list**: card grid with status badge + platform chips + progress bar
- **Admin UI — Project detail**: sub-navigation + Kanban board with inline status update

---

## [0.1.0] — 2026-04-08

### Phase 0 — Monorepo Skeleton & Infrastructure

#### Added
- **Monorepo setup**: Turborepo + pnpm workspaces (`apps/*`, `packages/*`, `agents/*`)
- **apps/api**: NestJS application scaffold (package.json, tsconfig, nest-cli.json)
- **apps/web**: Next.js 15 Admin/PM UI scaffold with Tailwind CSS
- **apps/portal**: Next.js 15 Client Portal scaffold
- **apps/orchestrator**: Phoenix (Elixir) orchestrator scaffold with environment configs
- **packages/shared-types**: Shared TypeScript types and enums used across all services
  - Enums: `UserRole`, `Platform`, `ProjectStatus`, `WorkItemType/Status`, `Priority`, `AgentType/Status`, `FeedbackType/Status`, `ReleaseStatus`, `BuildStatus`, `ArtifactType`, etc.
  - Models: `User`, `Customer`, `Opportunity`, `Contract`, `Project`, `WorkItem`, `Requirement`, `AgentCard`, `AgentTask`, `A2ATaskMessage`, `A2AStatusMessage`, `Feedback`, `Release`, `Build`, `DesignArtifact`
- **agents/**: Base agent core + mac-agent, windows-agent, aws-agent, triage-agent package scaffolds
- **infra/docker/docker-compose.yml**: Local dev environment (PostgreSQL with pgvector, Redis)
- **infra/docker/api.Dockerfile**: Multi-stage Docker build for NestJS API
- **infra/docker/orchestrator.Dockerfile**: Multi-stage Docker build for Phoenix orchestrator
- **infra/docker/init-db.sql**: PostgreSQL init script (enables pgvector extension)
- **CI/CD**: GitHub Actions workflows for api, web, portal, orchestrator
- **.env.example**: Full environment variable reference for all services
- **.prettierrc**: Shared code formatting rules
- **docs/requirements/SRS-v0.1.md**: Software Requirements Specification (moved from root)

[0.1.0]: https://github.com/KimJintak/ai-sw-development-agency-platform/releases/tag/v0.1.0
