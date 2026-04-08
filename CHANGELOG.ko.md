# 변경 기록

프로젝트의 주요 변경 사항을 이 파일에서 관리합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 따르며,
버전 관리는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 따릅니다.

---

## [미출시]

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
