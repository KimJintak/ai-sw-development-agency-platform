# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
