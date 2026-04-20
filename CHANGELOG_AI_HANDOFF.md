# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Cross-device sync — Claude Code hooks + shared settings
- New `CLAUDE.md` at repo root — baseline context auto-loaded by every Claude Code session on every device. Covers command cheatsheet, LLM routing rules, git conventions, cross-device workflow, and known gotchas.
- New `.claude/settings.json` (git-tracked) — shared permission allow-list and `Stop` / `SessionStart` hooks. All devices get the same setup.
- New `.claude/hooks/stop.sh` — appends timestamp · hostname · branch · last 5 commits · uncommitted stats to `.claude/progress.md` after each session. Stages the file (`git add`) but does not commit/push; user decides when.
- New `.claude/hooks/session-start.sh` — prints the last 40 lines of `progress.md` at session start and warns about ahead/behind vs. upstream.
- New `.claude/progress.md` — shared activity log, auto-appended by the hook.
- `.gitignore` now excludes only `.claude/settings.local.json` (personal overrides), so the shared settings propagate.

Effect: rotating across AWS EC2 / Mac mini / Windows / local, switching devices now shows the latest progress automatically. `git pull` → work → end session (hook writes progress) → `git commit && git push`. Session transcripts stay per-device, but "where I left off" is fully shared.

---

### LLM providers — AWS Bedrock added
- New `bedrock:` provider in `apps/api/src/llm/llm.service.ts`, `agents/base/src/llm.ts`, and the smoke-test script. Uses the AWS credential chain (`AWS_ACCESS_KEY_ID` / `AWS_PROFILE` / IAM role + `AWS_REGION`), so **Claude can be called with no separate Anthropic API key**. Example: `LLM_MODEL_DEFAULT="bedrock:anthropic.claude-sonnet-4-5-20250514-v1:0"`.
- `hasAnyKey()` / `hasAnyLlmKey()` now also accept `AWS_ACCESS_KEY_ID` / `AWS_PROFILE` as valid — AWS credentials alone disable dry-run.
- `.env.example` comments cover Bedrock + OpenRouter routing patterns.
- README (KR/EN) adds a "Syncing `.env` across machines" section (1Password CLI `op run --env-file=.env.tpl -- pnpm dev`, Doppler, etc.).
- Dependency: `@ai-sdk/amazon-bedrock` added to `apps/api` and `agents/base`.

### LLM provider abstraction — no vendor lock-in (API + Agents)
- New `LlmModule` / `LlmService` at `apps/api/src/llm/` built on `ai` + `@ai-sdk/*`. `modelFor(task)` reads `LLM_MODEL_<TASK>` and routes to `anthropic` / `openai` / `google` / `openrouter`. OpenRouter is supported via OpenAI-compatible baseURL override (one key → all models). `hasAnyLlmKey()` gates dry-run fallbacks.
- New `agents/base/src/llm.ts` — the same helper for agents (`modelFor`, `modelIdFor`, `hasAnyLlmKey`, re-exports `generateText` / `streamText`). Any agent that imports from `agent-base` can switch providers via env vars alone.
- `.env.example` adds `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY`, plus per-task keys `LLM_MODEL_DEFAULT` / `LLM_MODEL_PM` / `LLM_MODEL_TRIAGE` / `LLM_MODEL_SUMMARIZE` / `LLM_MODEL_CODE` / `LLM_MODEL_TEST`.
- `pm-agent.service.ts`: `Anthropic.messages.create()` → `generateText(...)`. `ANTHROPIC_API_KEY` hard dependency removed; `LlmService` injected via DI.
- `mac-agent/task-handler.ts`: same migration. `code_generation` uses `LLM_MODEL_CODE`, `test_generation` uses `LLM_MODEL_TEST`.
- Dependencies: dropped `@anthropic-ai/sdk` from `apps/api`, `agents/base`, `agents/mac-agent`. Added `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`.

### API — Feedback: attachments, status history, RBAC
- FeedbackAttachment model + endpoints (POST/GET/DELETE). 5MB/file, max 5, data-URL based.
- FeedbackStatusHistory model + `GET /feedback/:id/history`. Records from→to, actor, reason on status change / retriage / auto work-item creation.
- RolesGuard applied: status change / retriage / attachment delete = ADMIN/PM. Feedback create / attachment add = ADMIN/PM/CLIENT.

### API — Project Documents module
- New `ProjectDocument` / `ProjectDocumentAttachment` models. Categories: CLIENT / INTERNAL. Kinds: SPEC, CONTRACT, REFERENCE, API_DOC, MANUAL, DEPLOY_GUIDE, OTHER.
- New NestJS module at `apps/api/src/documents/`. List/read allowed for any authed user; create/update/delete = ADMIN/PM.

### Web — Infrastructure (i18n / auth / demo)
- i18n system (`apps/web/lib/i18n/`) — ko/en, localStorage-backed, auto-detects browser locale. Type-safe `TranslationKey`.
- `CurrentUserProvider` (`apps/web/lib/auth/`) — decodes JWT role, `hasRole()` helper for UI-level RBAC.
- Demo Mode (`apps/web/lib/demo/`) — localStorage toggle; axios request interceptor intercepts GETs and returns `resolveDemoData()` locally. 11 sample data sets (projects/feedback/crm/agents/messages/releases/chat/design/qa/work-items/admin-ops). Chat room skips WebSocket in demo mode.
- `useTheme` refactor — exposes `resolved` and `toggle()` so compact ThemeToggle transitions correctly when `theme === 'system'`.

### Web — Screens
- Settings page + manual (`/settings`, `/settings/manual`) — language/theme picker with usage guide.
- Project documents viewer (`/projects/:id/documents`, `/projects/:id/documents/:docId`) — category tabs, attachment upload/download, ADMIN/PM edit gate.
- Feedback inbox + detail + attachments — global `/feedback` inbox, reworked `/projects/:id/feedback`, detail page at `/projects/:id/feedback/:fbId` with status history and role-gated actions.
- Admin layout / Sidebar — wrapped with I18n + CurrentUser + DemoMode providers; sidebar uses TranslationKeys and adds a Demo Mode toggle switch; banner shown at the top when demo is on.
- Demo Tour page redesigned — added guide section (select scenario → play & speed → timeline jump).
- CRM title changed to "발주처관리".

### Tooling
- Added `puppeteer` devDependency + `scripts/screenshots.mjs` for automated screen captures.

### ⚠️ Git history rewrite (heads up for collaborators)
- The 49 commits ahead of `origin/main` had their author/committer rewritten to `KimJintak <runkorean21@gmail.com>` (not yet pushed).
- If you had branched off an older commit hash, rebase your branch onto the new `main` via `git rebase --onto main <old-base> <branch>`.
- A recovery tag `backup-before-author-rewrite` is kept locally.

---

## [0.20.0] — 2026-04-16
### Phase 19 — Feedback similarity search (FR-10-05)
- SimilarityService: auto-detects pg_trgm/pgvector, falls back to word-split LIKE matching.
- GET /projects/:id/feedback/similar for explicit duplicate lookup.
- Feedback creation auto-scans for 50%+ similar items, appends results.

## [0.19.0] — 2026-04-16
### Phase 18 — PM Agent: natural language → Cucumber (FR-03-03)
- PmAgentService: Claude API converts natural language to Gherkin Feature files.
- Dry-run mode when ANTHROPIC_API_KEY unset.
- POST /requirements/generate (persist) and /generate/preview (preview-only).

## [0.18.0] — 2026-04-16
### Phase 17 — Presigned download URLs (NFR-S-05)
- PresignedUrlService: HMAC-SHA256 signed URLs, 24h TTL, timing-safe verification.
- GET /builds/:id/download returns signed URL instead of raw CloudFront path.

## [0.17.0] — 2026-04-16
### Phase 16 — Auto-generate Work Items from requirements (FR-03-05)
- RequirementsService.create() parses Scenario: lines from Gherkin and creates STORY WorkItems linked via RequirementLink.

## [0.16.0] — 2026-04-16
### Phase 15 — CRM auto-notifications (FR-01-04, FR-01-05)
- CrmNotificationsService: new opportunity alerts + @Cron daily contract expiry check (30/7/1 day warnings) posted to project chats.
- @nestjs/schedule + ScheduleModule added.

## [0.15.0] — 2026-04-16
### Phase 14 — Delivery report PDF (FR-09-04)
- ReportPdfService: pdfkit-based A4 PDF with summary, requirements, releases, test runs.
- GET /portal/projects/:id/report/pdf endpoint.

## [0.14.0] — 2026-04-16
### Phase 13 — Post-deploy feedback loop (FR-10)
- FeedbackService: keyword-based auto-triage (type + severity), P0/P1 auto-creates WorkItem.
- Portal: GET /portal/feedback for customer-facing status tracking.
- Web: /projects/[id]/feedback page with create form and auto-classification.

## [0.13.0] — 2026-04-16
### Phase 12 — Client portal & delivery (FR-09)
- PortalUser auth with customerId in JWT.
- Portal REST: project list, progress, builds, requirements approve/reject, delivery report.
- Web: /portal route group with login, project list, project detail (4 tabs).

## [0.12.0] — 2026-04-16
### Phase 11 — Build & deploy management (FR-08)
- ReleasesService: release CRUD, status state machine, test-pass gating, per-platform builds.
- DeployPipelineService: test verify → build → S3/CloudFront → status, chat integration.
- Web: /projects/[id]/releases split-panel UI.

## [0.11.0-c] — 2026-04-16
### Phase 10-C — Keyword watchlist with feed highlighting
- WatchKeyword model, CRUD, server-side matchAll(). Feed enriched with watchMatches[].
- Web: watchlist management panel + multi-keyword body highlighting.

## [0.11.0-b] — 2026-04-16
### Phase 10-B — Stalled task radar (last AGENT_UPDATE based)
- stalledTasks() queries last AGENT_UPDATE ChatMessage per task. Returns idleMinutes, progress.
- Web: severity-colored cards (15m/30m/60m+).

## [0.11.0-a] — 2026-04-16
### Phase 10-A — Agency Ops dashboard + admin audit log
- AdminAuditLog model. AdminOpsService: summary, cross-project feed, stalled tasks.
- ADMIN-only via RolesGuard. All endpoints audit-logged.
- Web: /admin/ops with summary cards, stalled radar, keyword-filtered feed.

## [0.10.0-d] — 2026-04-16
### Phase 9-D — Chat task demo scenario
- "채팅으로 작업 지시" scenario (17s): /task command → agent updates → completion.

## [0.10.0-c] — 2026-04-15
### Phase 9-C — /task slash command + agent event chat bot
- Parse `/task @AGENT task_type [REF]`, dispatch via AgentsService, echo result.
- AgentsService posts AGENT_UPDATE/STATUS on applyUpdate/markComplete.

## [0.10.0-b] — 2026-04-15
### Phase 9-B — Chat real-time via socket.io gateway
- ChatGateway: NestJS socket.io /chat namespace, JWT auth, per-project rooms.
- Web: socket.io-client replaces 5s polling, live/offline badge.

## [0.10.0-a] — 2026-04-15
### Phase 9-A — Project chat + unified inbox (REST)
- ChatMessage + ChatReadState models. REST CRUD + inbox aggregation.
- Web: ChatRoom component, /messages inbox, sidebar "Messages" entry.

---

## [0.9.0-c] — 2026-04-14

### Phase 8-C — Public /demo route + mock agent response

#### Added
- **Public `/demo` route** — moved demo pages from `(admin)` to a new
  `(demo)` route group. New `DemoShell` reads `localStorage.accessToken`
  on mount:
  - Logged-in users get the original admin sidebar layout.
  - Anonymous visitors see a lightweight header with a login button
    and a footer banner reading "simulation only".
- **Mock agent code panel** — scenario #1's `agentUpdate` step now
  carries a pre-baked SwiftUI `LoginView.swift` snippet. The player
  renders it as an "Agent-generated code" panel without any real
  Claude API call.

---

## [0.9.0-b] — 2026-04-14

### Phase 8-B — Demo Tour guidance overlay + more scenarios

#### Added
- **Scenario #2 — Bug triage → auto-fix** (`bug-triage`): customer bug
  intake → `bug_fix` dispatch → root-cause analysis → PR creation →
  review approval → merge. 18 s.
- **Scenario #3 — Automated QA run** (`qa-run`): `test_generation`
  dispatch → per-platform (iOS/Android) execution → failure analysis →
  coverage report (81.3 % overall, 100 % on new requirements).
- **`CalloutOverlay`** — bottom-right toast showing each step's
  narration with a lightbulb icon, dismissable and auto-resetting on
  step change.
- **Panel highlight** — the panel matching a callout's `target` gets
  `ring-2 ring-primary`, directing viewer attention.

#### Changed
- `DemoPlayer` renders project / bug / QA panels conditionally based
  on which step kinds the active scenario emits.

---

## [0.9.0-a] — 2026-04-14

### Phase 8-A — Demo Tour sandbox + project-kickoff scenario

#### Added
- **Scenario engine** (`apps/web/lib/demo/`)
  - `scenarios.ts` — timeline-based `DemoStep` / `DemoScenario` types.
    First scenario "Project kickoff" (22 s): create project → 3
    requirements → auto-generated architecture → MAC_DEV dispatch →
    `task:update` → `task:complete`.
  - `use-demo-runner.ts` — `requestAnimationFrame`-based playback
    engine with play / pause / reset / seek / speed (0.5 × – 4 ×).
- **Demo Tour UI**
  - `/demo` — scenario index.
  - `/demo/[id]` — player with progress bar, timeline sidebar, current
    step card, and live panels for project, requirements, design, and
    agent activity. The design step renders a real Mermaid diagram via
    the existing `MermaidViewer`.
  - Sidebar entry for "Demo Tour".

#### Notes
- Logged-in learning path; frontend-only simulation (no API/DB writes)
  within Phase 8-A scope. Public route and mock agent data land in
  Phase 8-C.

---

## [0.8.0] — 2026-04-13

### Phase 7 — Agent Client Implementation (agent-base + mac-agent)

#### Added
- **`agent-base`** (`agents/base/src/`)
  - `AgentClient` — Phoenix Orchestrator WebSocket client implementing
    Phoenix Channel wire protocol. Auto channel join, heartbeat
    (Phoenix + channel level), `task:dispatch` receive, `task:update`
    / `task:complete` send. Auto-reconnect (5s interval), graceful
    shutdown on SIGINT/SIGTERM.
  - `TaskHandler` type — async function interface for agent-specific
    task processing. `TaskPayload` → `TaskResult`.

- **`mac-agent`** (`agents/mac-agent/src/`)
  - **WebSocket mode** (`npm run dev`) — connects to Orchestrator,
    registers as `MAC_DEV`, receives and processes tasks automatically.
  - **Standalone mode** (`npm run dev:standalone`) — polls API directly
    for `SUBMITTED` MAC_DEV tasks without Orchestrator. JWT login +
    periodic polling (default 10s).
  - `task-handler.ts` — Claude API task handler:
    - `code_generation` / `code_review` / `bug_fix` — code gen/review
    - `test_generation` — XCTest test case auto-generation
    - `build` — build simulation (actual xcodebuild integration pending)
  - **Dry-run mode** when no ANTHROPIC_API_KEY set (prompt preview).

#### Changed
- **`apps/web/lib/api-client.ts`** — browser uses relative paths via
  Next.js rewrites proxy for external access (devtunnels, etc.).
- **`apps/web/postcss.config.js`** added — enables Tailwind CSS compilation.
- **`apps/web/app/page.tsx`** added — root path → `/login` redirect.
- **`apps/web/app/(admin)/projects/page.tsx`** — "New Project" button
  now opens creation form (customer select, name, platforms toggle).
- **`apps/api/src/main.ts`** — removed global `RolesGuard` (was causing
  403 before JWT auth ran). CORS set to `origin: true`.
- **Build fixes** — type casting in `auth.service.ts`, `jwt.strategy.ts`,
  `projects.service.ts`.
- **`apps/web/package.json`** — removed non-existent `@radix-ui/react-badge`.

#### Known Limitations
- Orchestrator (Elixir) not available in this environment — WebSocket
  mode requires Elixir. Standalone mode works with API directly.
- Actual xcodebuild / Flutter build integration not implemented —
  `build` task type runs simulation only.

---

## [0.7.0] — 2026-04-10

### Phase 6 — QA & Test Management (FR-07)

#### Added
- **`QaModule`** (`apps/api/src/qa/`)
  - `QaService` — Prisma-based `TestCase` / `TestRun` / `TestResult` CRUD.
    Methods: `findTestCases(workItemId, platform?)`,
    `findTestRuns(releaseId, status?)`, `recordResult`,
    `getRunSummary` (pass/fail/skip aggregation),
    `getProjectCoverage` (project-wide test coverage stats).
  - `createTestRun` initialises status as `PENDING`.
    `updateTestRun` auto-sets `startedAt` when status changes to
    `RUNNING`, and `endedAt` when `COMPLETED` or `FAILED`.
  - `removeTestCase` deletes test_results → test_case in a transaction.
    `removeTestRun` follows the same pattern.
  - `QaController` (JWT auth) —
    `GET /api/qa/test-cases?workItemId=&platform=`,
    `GET /api/qa/test-cases/:id`, `POST /api/qa/test-cases`,
    `PATCH /api/qa/test-cases/:id`, `DELETE /api/qa/test-cases/:id`,
    `GET /api/qa/test-runs?releaseId=&status=`,
    `GET /api/qa/test-runs/:id`, `POST /api/qa/test-runs`,
    `PATCH /api/qa/test-runs/:id`, `DELETE /api/qa/test-runs/:id`,
    `POST /api/qa/test-runs/:runId/results`,
    `GET /api/qa/test-runs/:runId/results`,
    `GET /api/qa/test-runs/:runId/summary`,
    `GET /api/qa/coverage/:projectId`.
  - DTOs: `CreateTestCaseDto`, `UpdateTestCaseDto`, `CreateTestRunDto`,
    `UpdateTestRunDto`, `RecordTestResultDto`, `ListTestCasesQuery`,
    `ListTestRunsQuery`.
- **`app.module.ts`** — `QaModule` import added.
- **Admin UI — `/projects/:id/qa` page**
  (`apps/web/app/(admin)/projects/[id]/qa/page.tsx`)
  - Project coverage summary cards (coverage %, test case count,
    covered work items, total work items).
  - 2-column layout: left sidebar with work item list (type/status
    badges), right panel with test cases for the selected work item.
  - Test case creation form: title, scenario (Gherkin-style placeholder),
    platform selector. Auto-refreshes list + coverage after creation.

#### Known Limitations
- TestRun is linked to Release; without the Release module, TestRuns
  can only be created via API. Release module planned for Phase 7.
- Test Agent auto-execution (FR-07-03) deferred until agent execution
  pipeline matures.
- No edit/delete UI for test cases. PATCH/DELETE endpoints exist.
- No size limit on TestResult errorLog — large log storage integration
  deferred to Phase 8+.

---

## [0.6.1] — 2026-04-09

### Phase 3.5 — Outbox retry worker + applyUpdate atomicity

#### Added
- **`OutboxWorker`** (`apps/api/src/agents/outbox.worker.ts`)
  - Periodic `setInterval` worker managed by `OnModuleInit` /
    `OnModuleDestroy`.
  - Sweeps `SUBMITTED` agent tasks whose `errorLog` starts with
    `redis_publish_failed` and retries `RedisService.publishTask`.
  - On success, clears `errorLog` to `null`. On failure, logs a
    warning and leaves the row for the next tick.
  - Skips rows without `projectId` (they can't be dispatched — left
    for operator inspection).
  - Env vars: `OUTBOX_WORKER_ENABLED` (default true),
    `OUTBOX_INTERVAL_MS` (default 15000), `OUTBOX_BATCH_SIZE`
    (default 25).
  - Registered in `AgentsModule` providers.

#### Changed
- `AgentsService.applyUpdate` now wraps read-merge-write in a single
  `$transaction` with `Serializable` isolation. The previous split
  (`findUnique` → merge → `update`) lost telemetry under concurrent
  Orchestrator callbacks. The DB now serializes conflicting updates;
  on P2034 the error propagates and the caller retries.
- The pre-existence check (`findTask`) is folded into the transaction
  body, closing a smaller race window.
- `startedAt` is only written when the row wasn't already in
  `WORKING` state, preventing overwrite on duplicate updates.

#### Known limitations
- The outbox is `agent_tasks.error_log`-based, not a dedicated table —
  suitable for transient Redis outages only. A durable outbox table
  lands in Phase 6 (agent execution pipeline hardening).
- No in-service retry on Serializable conflicts — failures surface as
  500s and must be retried upstream by the Orchestrator.

---

## [0.6.0] — 2026-04-09

### Phase 5 — Design Hub (FR-06)

#### Added
- **`DesignModule`** (`apps/api/src/design/`)
  - `DesignService` — CRUD over `DesignArtifact` /
    `DesignArtifactVersion`. Any content change (`mermaidCode` /
    `figmaUrl`) snapshots a new version row and bumps the counter
    (FR-06-04, FR-06-05 — immutability of prior versions). Title-only
    edits don't create a new version.
  - `create` rejects artifacts with neither `mermaidCode` nor
    `figmaUrl` (`BadRequestException`).
  - `findByProject(projectId, type?)` supports per-tab filtering.
  - `remove` cascades versions → artifact inside a transaction.
  - `DesignController` (JWT) — `GET /api/design?projectId=&type=`,
    `GET /api/design/:id`, `GET /:id/versions`, `POST /api/design`,
    `PATCH /:id`, `DELETE /:id`.
  - DTOs: `CreateDesignArtifactDto`, `UpdateDesignArtifactDto`.
    `ArtifactType` is `ARCHITECTURE/ERD/WIREFRAME/FLOWCHART/SEQUENCE`.
- **`app.module.ts`** imports `DesignModule`.
- **Admin UI — `/projects/:id/design` page**
  (`apps/web/app/(admin)/projects/[id]/design/page.tsx`)
  - FR-06-06: tabs for Architecture / ERD / Wireframe / Flowchart /
    Sequence.
  - FR-06-01: Mermaid preview via `mermaid@11.4.1` (dynamic client
    import, no SSR impact).
  - FR-06-02: theme dropdown (`default/dark/forest/neutral`).
  - FR-06-03: Wireframe tab renders the Figma URL in an iframe.
  - Tab-specific Mermaid templates pre-filled in the new-artifact form.
  - Two-column layout: artifact list on the left, preview on the right.
- **`components/design/mermaid-viewer.tsx`** — reusable MermaidViewer
  component with `securityLevel: 'strict'`, error boxes, and
  SSR-safe dynamic import.

#### Known limitations
- No in-place edit UI — the PATCH endpoint exists but is not wired
  into the UI yet.
- Figma URLs are not validated; a `figma.com` allow-list will be
  added in Phase 6.
- UX Agent auto-generation (FR-06-07) deferred to Phase 7+.
- Mermaid `securityLevel: 'strict'` disables some advanced syntax
  (e.g. click events).

---

## [0.5.0] — 2026-04-09

### Phase 4 — Requirements management (FR-03)

#### Added
- **`RequirementsModule`** (`apps/api/src/requirements/`)
  - `RequirementsService` — Prisma CRUD over `Requirement` /
    `RequirementVersion` / `RequirementLink`; every write runs inside
    `$transaction`.
  - Feature-file or title changes snapshot a new `RequirementVersion`
    row and increment `version` (FR-03-04 — history retention).
    Status/platform-only edits do NOT bump the version.
  - `create` writes the Requirement + initial `v1` version in one
    transaction.
  - `remove` deletes `requirement_links` → `requirement_versions` →
    `requirement` in order to satisfy FK constraints.
  - `RequirementsController` (JWT) —
    `GET /api/requirements?projectId=`, `GET /api/requirements/:id`
    (with versions + linked work items), `GET /:id/versions`,
    `POST /api/requirements`, `PATCH /:id`, `POST /:id/approve`,
    `POST /:id/links`, `DELETE /:id/links/:workItemId`, `DELETE /:id`.
  - DTOs: `CreateRequirementDto`, `UpdateRequirementDto` (with
    `changeNote`), `ApproveRequirementDto`, `LinkWorkItemDto`.
    `Platform` enum is `MACOS/WINDOWS/IOS/ANDROID/WEB/LINUX`.
  - `@CurrentUser()` injects `changedBy`.
- **`app.module.ts`** imports `RequirementsModule`.
- **Admin UI — `/projects/:id/requirements` page**
  (`apps/web/app/(admin)/projects/[id]/requirements/page.tsx`) — list
  + new-requirement form (title, platform toggles, feature-file textarea
  with a Gherkin template). Shows version count / linked work-item
  count. Matches the existing `SUB_NAV` `Requirements` tab.

#### Known limitations
- No in-place edit UI yet (list + create only). The PATCH endpoint
  exists and can be invoked via curl.
- PM Agent auto-generation (FR-03-03) is deferred to Phase 7+ (after
  the agent execution pipeline matures).
- No Gherkin syntax validation — malformed feature files are stored
  as-is.
- `linkWorkItem` does not pre-validate the work item; FK violations
  surface as 500s.

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
