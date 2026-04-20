# AI-Powered Software Development Agency Platform

[한국어](#한국어) · [English](#english)

---

## 한국어

AI 에이전트가 요구사항 수집부터 설계·개발·QA·배포·운영·피드백까지 소프트웨어
외주 개발 전 과정을 수행하는 SaaS 플랫폼입니다. PM·디자이너·QA·DevOps 역할을
각각의 에이전트가 담당하고, 오케스트레이터가 작업을 분배·관리합니다.

### 현재 상태

- **Phase 19** 진행 중 (`피드백 유사도 검색`, FR-10-05 기준).
- 상세 진행 기록은 [`CHANGELOG_AI_HANDOFF_KR.md`](./CHANGELOG_AI_HANDOFF_KR.md) /
  [`CHANGELOG_AI_HANDOFF.md`](./CHANGELOG_AI_HANDOFF.md) 참조.
- 요구사항 명세는 [`docs/requirements/SRS-v0.1.md`](./docs/requirements/SRS-v0.1.md).

### 아키텍처

```
┌──────────────────┐     ┌──────────────────┐
│  apps/web        │     │  apps/portal     │
│  (Next.js 15)    │     │  (Next.js 15)    │
│  내부 운영 콘솔 │     │  고객사 포털      │
└────────┬─────────┘     └─────────┬────────┘
         │  REST / WebSocket       │
         └────────────┬────────────┘
                      ▼
             ┌──────────────────┐
             │  apps/api        │
             │  (NestJS 11)     │
             │  PostgreSQL +    │
             │  Prisma + Redis  │
             └────────┬─────────┘
                      │ 작업 위임
                      ▼
             ┌──────────────────┐      ┌──────────────────┐
             │ apps/orchestrator│◀────▶│ agents/*         │
             │ (Elixir/Phoenix) │      │ PM·QA·디자인 등 │
             │  작업 분배·상태 │      │ (Node + Claude)  │
             └──────────────────┘      └──────────────────┘
```

### 기술 스택

| 영역          | 스택                                                   |
| ------------- | ------------------------------------------------------ |
| Web / Portal  | Next.js 15, React 19, TailwindCSS, Radix UI, Zustand   |
| API           | NestJS 11, Prisma, PostgreSQL, Redis, Socket.IO        |
| Orchestrator  | Elixir 1.17, Phoenix, Ecto                             |
| Agents        | Node.js 20, Anthropic SDK (`@anthropic-ai/sdk`)        |
| 인프라        | Docker, Ansible, AWS (infra/ 아래)                     |
| 모노레포      | pnpm workspace + Turborepo                             |

### 빠른 시작

**사전 요구사항**: Node.js ≥ 20, pnpm ≥ 9, Elixir 1.17(orchestrator 개발 시),
Docker + Docker Compose.

```bash
git clone https://github.com/KimJintak/ai-sw-development-agency-platform.git
cd ai-sw-development-agency-platform
pnpm install
cp .env.example .env                              # 값 채우기 (ANTHROPIC_API_KEY 등)
docker compose -f infra/docker/docker-compose.yml up -d
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm dev                                          # 전체 turbo 파이프라인
```

개별 앱 실행:

```bash
pnpm --filter web dev         # http://localhost:3000
pnpm --filter portal dev      # 고객사 포털
pnpm --filter api dev         # http://localhost:4000
cd apps/orchestrator && mix phx.server
```

### 디렉터리 구조

```
.
├── apps/
│   ├── api/            # NestJS API + Prisma schema
│   ├── web/            # 내부 운영 콘솔 (admin + demo)
│   ├── portal/         # 고객사 외부 포털
│   └── orchestrator/   # Elixir/Phoenix 오케스트레이터
├── agents/
│   ├── base/           # 공통 에이전트 런타임
│   ├── triage-agent/   # 피드백 자동 분류
│   ├── aws-agent/      # AWS 배포 에이전트
│   ├── mac-agent/ windows-agent/
├── packages/
│   ├── shared-types/   # 공용 TS 타입
│   └── ui/             # 공용 UI 컴포넌트
├── docs/               # 요구사항·설계 문서
├── infra/              # Docker / Ansible / AWS
└── scripts/            # 스크린샷 등 유틸리티
```

### 주요 스크립트

| 명령                           | 설명                              |
| ------------------------------ | --------------------------------- |
| `pnpm dev`                     | Turborepo로 전체 dev 서버 실행    |
| `pnpm build`                   | 전체 빌드                         |
| `pnpm lint`                    | 전체 lint                         |
| `pnpm test`                    | 전체 테스트                       |
| `pnpm format`                  | Prettier 포맷                     |
| `pnpm --filter api db:migrate` | Prisma 마이그레이션               |
| `pnpm --filter api db:studio`  | Prisma Studio                     |

### 환경 변수

`.env.example`에 주요 키(DATABASE_URL, REDIS_URL, JWT_*, 각 LLM 프로바이더,
AWS_*, GITHUB_TOKEN, FIGMA_ACCESS_TOKEN 등)가 정의되어 있습니다. 각 앱은
루트 `.env`를 공유합니다. LLM 프로바이더 키가 하나도 없으면 PM Agent 등
LLM 기반 서비스는 **dry-run 모드**(템플릿 응답)로 동작합니다.

### LLM 프로바이더 (벤더 락인 방지)

PM Agent · mac-agent 등 AI 호출은 `ai` + `@ai-sdk/*` 기반 추상 계층
(`apps/api/src/llm/`, `agents/base/src/llm.ts`)을 통해 실행됩니다.
`<provider>:<modelId>` 형식으로 태스크별 모델을 지정합니다.

```
LLM_MODEL_DEFAULT="anthropic:claude-sonnet-4-5"
LLM_MODEL_PM="anthropic:claude-sonnet-4-5"         # 긴 문맥·Gherkin
LLM_MODEL_TRIAGE="openai:gpt-4o-mini"              # 빠르고 저렴
LLM_MODEL_SUMMARIZE="google:gemini-2.0-flash"
LLM_MODEL_CODE="anthropic:claude-sonnet-4-5"
LLM_MODEL_TEST="openai:gpt-4o-mini"
```

지원 프로바이더: `anthropic` · `openai` · `google` · `openrouter`
(OpenRouter는 단일 키로 모든 모델을 사용할 수 있는 게이트웨이).
여러 키를 동시에 세팅하면 태스크마다 서로 다른 프로바이더를 자유롭게 선택할
수 있습니다.

### Demo Mode

Web 콘솔에는 로컬 `demo-mode` 플래그가 있어 사이드바 토글로 켤 수 있습니다.
API 호출을 가로채 샘플 데이터를 반환하므로, 서버 없이 UI 흐름을 시연할 수
있습니다. 활성 시 상단에 경고 배너가 표시됩니다.

### 개발 규칙

- **커밋**: Conventional Commits (`feat(web): …`, `fix(api): …`, `docs: …`).
- **브랜치**: `main`이 기본. 기능 브랜치에서 작업 후 PR.
- **변경 기록**: 기능 머지 시 `CHANGELOG_AI_HANDOFF*.md`의 `[미출시]` 섹션을
  업데이트한 뒤, 릴리스 시 버전 섹션으로 옮깁니다.

### 라이선스

Private — KimJintak 소유. 외부 배포 금지.

---

## English

A SaaS platform where AI agents handle the full software outsourcing workflow —
requirements intake, design, development, QA, deployment, operations, and
feedback. Separate agents play the PM / Designer / QA / DevOps roles, and an
orchestrator distributes and tracks their work.

### Status

- Currently on **Phase 19** (`Feedback similarity search`, FR-10-05).
- See [`CHANGELOG_AI_HANDOFF.md`](./CHANGELOG_AI_HANDOFF.md) (EN) or
  [`CHANGELOG_AI_HANDOFF_KR.md`](./CHANGELOG_AI_HANDOFF_KR.md) (KR) for
  per-phase history.
- Requirements spec: [`docs/requirements/SRS-v0.1.md`](./docs/requirements/SRS-v0.1.md).

### Architecture

```
┌──────────────────┐     ┌──────────────────┐
│  apps/web        │     │  apps/portal     │
│  (Next.js 15)    │     │  (Next.js 15)    │
│  Internal admin  │     │  Customer portal │
└────────┬─────────┘     └─────────┬────────┘
         │  REST / WebSocket       │
         └────────────┬────────────┘
                      ▼
             ┌──────────────────┐
             │  apps/api        │
             │  (NestJS 11)     │
             │  PostgreSQL +    │
             │  Prisma + Redis  │
             └────────┬─────────┘
                      │ dispatch
                      ▼
             ┌──────────────────┐      ┌──────────────────┐
             │ apps/orchestrator│◀────▶│ agents/*         │
             │ (Elixir/Phoenix) │      │ PM/QA/Design/... │
             │  task routing    │      │ (Node + Claude)  │
             └──────────────────┘      └──────────────────┘
```

### Tech stack

| Area          | Stack                                                  |
| ------------- | ------------------------------------------------------ |
| Web / Portal  | Next.js 15, React 19, TailwindCSS, Radix UI, Zustand   |
| API           | NestJS 11, Prisma, PostgreSQL, Redis, Socket.IO        |
| Orchestrator  | Elixir 1.17, Phoenix, Ecto                             |
| Agents        | Node.js 20, Anthropic SDK (`@anthropic-ai/sdk`)        |
| Infra         | Docker, Ansible, AWS (under `infra/`)                  |
| Monorepo      | pnpm workspace + Turborepo                             |

### Quickstart

**Prerequisites**: Node.js ≥ 20, pnpm ≥ 9, Elixir 1.17 (if working on the
orchestrator), Docker + Docker Compose.

```bash
git clone https://github.com/KimJintak/ai-sw-development-agency-platform.git
cd ai-sw-development-agency-platform
pnpm install
cp .env.example .env                              # fill in ANTHROPIC_API_KEY, etc.
docker compose -f infra/docker/docker-compose.yml up -d
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm dev                                          # full turbo pipeline
```

Run apps individually:

```bash
pnpm --filter web dev         # http://localhost:3000
pnpm --filter portal dev      # customer portal
pnpm --filter api dev         # http://localhost:4000
cd apps/orchestrator && mix phx.server
```

### Layout

```
.
├── apps/
│   ├── api/            # NestJS API + Prisma schema
│   ├── web/            # Internal admin console (admin + demo)
│   ├── portal/         # Customer-facing portal
│   └── orchestrator/   # Elixir/Phoenix orchestrator
├── agents/
│   ├── base/           # Shared agent runtime
│   ├── triage-agent/   # Auto-triage feedback
│   ├── aws-agent/      # AWS deploy agent
│   ├── mac-agent/ windows-agent/
├── packages/
│   ├── shared-types/   # Shared TS types
│   └── ui/             # Shared UI components
├── docs/               # Requirements & design docs
├── infra/              # Docker / Ansible / AWS
└── scripts/            # Screenshots & utilities
```

### Scripts

| Command                        | Description                    |
| ------------------------------ | ------------------------------ |
| `pnpm dev`                     | Start all dev servers (turbo)  |
| `pnpm build`                   | Build all packages             |
| `pnpm lint`                    | Lint all packages              |
| `pnpm test`                    | Run all tests                  |
| `pnpm format`                  | Prettier format                |
| `pnpm --filter api db:migrate` | Prisma migrations              |
| `pnpm --filter api db:studio`  | Prisma Studio                  |

### Environment

`.env.example` declares the main keys (`DATABASE_URL`, `REDIS_URL`, `JWT_*`,
per-provider LLM keys, `AWS_*`, `GITHUB_TOKEN`, `FIGMA_ACCESS_TOKEN`, ...). All
apps share the root `.env`. When no LLM provider key is set, services like the
PM Agent fall back to **dry-run mode** (template responses).

### LLM providers (no vendor lock-in)

AI calls (PM Agent, mac-agent, …) go through an abstraction layer
(`apps/api/src/llm/`, `agents/base/src/llm.ts`) built on `ai` + `@ai-sdk/*`.
Models are selected per task via `<provider>:<modelId>`:

```
LLM_MODEL_DEFAULT="anthropic:claude-sonnet-4-5"
LLM_MODEL_PM="anthropic:claude-sonnet-4-5"         # long context · Gherkin
LLM_MODEL_TRIAGE="openai:gpt-4o-mini"              # cheap + fast
LLM_MODEL_SUMMARIZE="google:gemini-2.0-flash"
LLM_MODEL_CODE="anthropic:claude-sonnet-4-5"
LLM_MODEL_TEST="openai:gpt-4o-mini"
```

Supported providers: `anthropic` · `openai` · `google` · `openrouter`
(OpenRouter is a gateway — one key for all models). Mix and match freely per
task.

### Demo Mode

The web console has a sidebar-level `demo-mode` toggle backed by localStorage.
An axios interceptor rewrites GET responses with local sample data, letting
you walk through the UI without a running backend. A warning banner appears at
the top while active.

### Conventions

- **Commits**: Conventional Commits (`feat(web): …`, `fix(api): …`, `docs: …`).
- **Branching**: `main` is the integration branch; work on feature branches
  and open a PR.
- **Changelog**: on merge, update the `[Unreleased]` section of
  `CHANGELOG_AI_HANDOFF*.md`; on release, move it under a version heading.

### License

Private — owned by KimJintak. Not for redistribution.
