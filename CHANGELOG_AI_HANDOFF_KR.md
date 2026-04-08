# 변경 기록

프로젝트의 주요 변경 사항을 이 파일에서 관리합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 따르며,
버전 관리는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 따릅니다.

---

## [미출시]

---

## [0.2.0] — 2026-04-08

### Phase 1 — 인증, CRM, 프로젝트 관리

#### 용어 정리
| 용어 | 정의 |
|------|------|
| **Work Item** | 개발 단위 작업 (Epic → Story → Task 계층) |
| **Orchestrator** | 에이전트 작업 흐름을 조율하는 Phoenix 서버 |
| **A2A** | Agent-to-Agent Protocol — 에이전트 간 표준 통신 규약 |
| **MCP** | Model Context Protocol — 에이전트와 외부 도구 연결 규약 |
| **Agent Card** | 에이전트가 자신의 능력과 엔드포인트를 선언하는 JSON 문서 |
| **DSL** | Domain-Specific Language — 오케스트레이션 설정용 JSON 문법 |
| **Triage** | 수신된 피드백을 유형·심각도별로 분류하는 과정 |
| **Feature File** | Cucumber BDD 형식의 요구사항 명세 파일 (.feature) |

#### 추가
- **Prisma 스키마** (`apps/api/prisma/schema.prisma`): 전체 엔티티 정의
  - 인증: `User`, `PortalUser`
  - CRM: `Customer`, `Opportunity`, `Contract`
  - 프로젝트: `Project`, `ProjectMember`
  - Work Item: `WorkItem`, `WorkItemDependency`, `TaskEstimation`
  - 요구사항: `Requirement`, `RequirementVersion`, `RequirementLink`
  - 디자인: `DesignArtifact`, `DesignArtifactVersion`
  - QA: `TestCase`, `TestRun`, `TestResult`
  - 릴리스: `Release`, `ReleaseItem`, `Build`
  - 에이전트: `AgentCard`, `AgentTask`
  - 피드백: `Feedback` (pgvector 임베딩 필드 포함)
- **Prisma 시드** (`apps/api/prisma/seed.ts`): Admin/PM 사용자 + 12개 에이전트 카드 초기 데이터
- **NestJS 공통 레이어**:
  - `PrismaService` / `PrismaModule` (전역)
  - `JwtAuthGuard`, `RolesGuard`
  - `@CurrentUser()`, `@Roles()` 데코레이터
  - `HttpExceptionFilter`, `AllExceptionsFilter`
- **Auth 모듈**: JWT 로그인, 리프레시 토큰, `/api/auth/me`
- **CRM 모듈**: 고객사, 영업기회(파이프라인 단계 관리), 계약 CRUD
- **Projects 모듈**: CRUD + 진척률 조회 + 오케스트레이션 DSL 업데이트
- **Work Items 모듈**: 계층형 CRUD (Epic→Story→Task) + Kanban 상태 업데이트
- **`main.ts`**: Swagger, CORS, ValidationPipe, 전역 필터 설정
- **Admin UI — 로그인 페이지** (`apps/web/app/(auth)/login/page.tsx`)
- **Admin UI — Sidebar**: 현재 경로 하이라이트 포함 네비게이션
- **Admin UI — 대시보드**: 프로젝트/에이전트 요약 통계
- **Admin UI — CRM 페이지**: 고객 테이블 + 영업 파이프라인 (단계별 Kanban)
- **Admin UI — 프로젝트 목록**: 상태 배지 + 플랫폼 칩 + 진척률 바 카드 그리드
- **Admin UI — 프로젝트 상세**: 서브 네비게이션 + 인라인 상태 변경 Kanban 보드

---

## [0.1.0] — 2026-04-08

### Phase 0 — 모노레포 골격 및 인프라 기반

#### 추가
- **모노레포 설정**: Turborepo + pnpm 워크스페이스 (`apps/*`, `packages/*`, `agents/*`)
- **apps/api**: NestJS 애플리케이션 뼈대 (package.json, tsconfig, nest-cli.json)
- **apps/web**: Next.js 15 Admin/PM UI 뼈대 (Tailwind CSS 포함)
- **apps/portal**: Next.js 15 클라이언트 포털 뼈대
- **apps/orchestrator**: Phoenix(Elixir) 오케스트레이터 뼈대 및 환경별 설정
- **packages/shared-types**: 전 서비스 공유 TypeScript 타입 및 Enum
  - Enum: `UserRole`, `Platform`, `ProjectStatus`, `WorkItemType/Status`, `Priority`, `AgentType/Status`, `FeedbackType/Status`, `ReleaseStatus`, `BuildStatus`, `ArtifactType` 등
  - 모델: `User`, `Customer`, `Opportunity`, `Contract`, `Project`, `WorkItem`, `Requirement`, `AgentCard`, `AgentTask`, `A2ATaskMessage`, `A2AStatusMessage`, `Feedback`, `Release`, `Build`, `DesignArtifact`
- **agents/**: 에이전트 공통 코어 + mac-agent, windows-agent, aws-agent, triage-agent 패키지 구조
- **infra/docker/docker-compose.yml**: 로컬 개발 환경 (PostgreSQL with pgvector, Redis)
- **infra/docker/api.Dockerfile**: NestJS API 멀티 스테이지 Docker 빌드
- **infra/docker/orchestrator.Dockerfile**: Phoenix 오케스트레이터 멀티 스테이지 Docker 빌드
- **infra/docker/init-db.sql**: PostgreSQL 초기화 스크립트 (pgvector 확장 활성화)
- **CI/CD**: api, web, portal, orchestrator 각각의 GitHub Actions 워크플로우
- **.env.example**: 전 서비스 환경변수 키 참조 문서
- **.prettierrc**: 공유 코드 포맷 규칙
- **docs/requirements/SRS-v0.1.md**: 소프트웨어 요구사항 명세서 (루트에서 이동)

[0.1.0]: https://github.com/KimJintak/ai-sw-development-agency-platform/releases/tag/v0.1.0
