# 변경 기록

프로젝트의 주요 변경 사항을 이 파일에서 관리합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 따르며,
버전 관리는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 따릅니다.

---

## [미출시]

### API — 피드백 확장 (첨부 + 상태 이력 + RBAC)

#### 추가
- **`FeedbackAttachment`** 모델 + 엔드포인트
  - `POST /feedback/:id/attachments` — 파일당 5MB, 최대 5개, data URL 기반.
  - `GET /feedback/attachments/:attId` — 원본 바이너리 스트리밍 다운로드.
  - `DELETE /feedback/attachments/:attId` — ADMIN/PM 전용.
- **`FeedbackStatusHistory`** 모델 + `GET /feedback/:id/history`
  - 상태 변경·재분류·Work Item 자동 생성 시 `from → to` + 이유 + 변경 주체 기록.
- **RBAC 강화** — `RolesGuard` 적용. 상태 변경·재분류·첨부 삭제는 ADMIN/PM,
  피드백 제출·첨부 추가는 ADMIN/PM/CLIENT.

### API — 프로젝트 문서 모듈

#### 추가
- **`ProjectDocument` / `ProjectDocumentAttachment`** 모델
  - 카테고리 `CLIENT` / `INTERNAL`, 종류 `SPEC`·`CONTRACT`·`REFERENCE`·
    `API_DOC`·`MANUAL`·`DEPLOY_GUIDE`·`OTHER`.
- **Documents NestJS 모듈** (`apps/api/src/documents/`)
  - `GET /projects/:projectId/documents?category=` — 목록.
  - `POST/PATCH/DELETE` 및 첨부 CRUD는 ADMIN/PM 전용, 조회는 인증 사용자.

### Web — 인프라 (i18n / auth / demo)

#### 추가
- **i18n 시스템** (`apps/web/lib/i18n/`) — ko/en, `localStorage`에 저장,
  브라우저 언어 자동 감지. `useI18n()` + `TranslationKey` 타입 안전 번역.
- **`CurrentUserProvider`** (`apps/web/lib/auth/`) — JWT에서 role 디코드,
  `hasRole()` 헬퍼로 UI 레벨 권한 분기.
- **Demo Mode** (`apps/web/lib/demo/`)
  - `DemoModeProvider` — localStorage 토글.
  - `apiClient` 요청 인터셉터에서 GET을 가로채 `resolveDemoData()` 결과를
    로컬 응답으로 반환 (쓰기는 실패 허용).
  - 11종 샘플 데이터 세트: projects·feedback·crm·agents·messages·releases·
    chat·design·qa·work-items·admin-ops.
  - 채팅방은 demo 모드에서 WebSocket 연결을 건너뛰고 "connected" 표시.

#### 변경
- **`useTheme`** — `resolved` 값과 `toggle()` 헬퍼 노출. compact
  ThemeToggle이 `system` 선택 시에도 올바른 다음 테마로 전환.

### Web — 화면

#### 추가
- **Settings 페이지 + 매뉴얼** (`/settings`, `/settings/manual`) — 언어/테마
  선택 + 사용법 안내.
- **프로젝트 문서 뷰어** (`/projects/:id/documents`, `/projects/:id/documents/:docId`)
  — 카테고리 탭, 첨부 업/다운로드, ADMIN/PM만 편집.
- **Feedback 목록/상세/첨부 UI**
  - 전역 인박스 `/feedback`.
  - 프로젝트별 목록 `/projects/:id/feedback` 개편.
  - 상세 `/projects/:id/feedback/:fbId` — 첨부 업/다운, 상태 변경 이력,
    역할별 UI 분기 (CLIENT는 제출만, ADMIN/PM만 상태 변경·재분류·첨부 삭제).

#### 변경
- **Admin layout / Sidebar** — `I18nProvider` + `CurrentUserProvider` +
  `DemoModeProvider`로 래핑. 사이드바 메뉴 전체를 `TranslationKey` 기반으로
  전환하고 Demo Mode 토글 스위치 추가. demo 활성 시 상단 배너 노출.
- **Demo Tour 페이지** — 시나리오 선택 → 재생/속도 조절 → 타임라인 이동
  안내 섹션 추가, 카드 레이아웃 개선.
- **CRM 타이틀** "발주처관리"로 변경.

### 개발

#### 추가
- `puppeteer` devDependency + `scripts/screenshots.mjs` — 화면 캡처 자동화.

### ⚠️ Git 이력 재작성 (협업자 주의)

- `origin/main`보다 앞서 있던 **49 커밋의 author/committer를
  `KimJintak <runkorean21@gmail.com>`으로 재작성**했습니다 (아직 push 전).
- 다른 작업자가 이전 커밋 해시 기준으로 브랜치를 파놨다면 `main` 최신화 후
  해당 브랜치를 `git rebase --onto main <old-base> <branch>`로 옮겨야 합니다.
- 복구용 백업 태그 `backup-before-author-rewrite`가 로컬에 남아 있습니다.

---

## [0.20.0] — 2026-04-16

### Phase 19 — 피드백 유사도 검색 (FR-10-05)

#### 추가
- **`SimilarityService`** (`apps/api/src/feedback/similarity.service.ts`)
  - `onModuleInit()` 에서 `pg_extension` 테이블 조회로 `pgvector` /
    `pg_trgm` 가용 여부 자동 감지. `pg_trgm` 없으면 자동 `CREATE
    EXTENSION` 시도.
  - **pg_trgm 모드** (기본): `similarity()` 함수로 title + body 대비
    트라이그램 유사도 계산. threshold 이상만 반환.
  - **폴백 모드**: 단어 분할 후 LIKE 매칭 비율 기반.
  - pgvector가 활성화되면 벡터 검색으로 전환 가능하도록 구조 설계
    (현재 embedding 컬럼 주석 상태).

- **`GET /api/projects/:id/feedback/similar?q=...`** — 유사 피드백
  검색 (limit, threshold 옵션).

- **피드백 생성 시 중복 감지** — `POST /projects/:id/feedback` 호출 시
  자동으로 유사도 50%+ 피드백을 스캔. 결과에 `similarFeedback[]` 첨부.
  채팅 알림에 `"유사 피드백 N건 감지 (최고 X%)"` 포함.

---

## [0.19.0] — 2026-04-16

### Phase 18 — PM Agent: 자연어 → Cucumber 자동 변환 (FR-03-03)

#### 추가
- **`PmAgentService`** (`apps/api/src/requirements/pm-agent.service.ts`)
  - `generateFeature(input)` — Claude API(`@anthropic-ai/sdk`)로
    자연어 요구사항을 Gherkin Feature 파일로 변환.
  - System prompt: 프로젝트명 + 타겟 플랫폼 컨텍스트 제공. 출력은
    순수 Gherkin(마크다운 없이).
  - `ANTHROPIC_API_KEY` 미설정 시 **dry-run 모드** — 템플릿 기반
    Feature 파일 생성 (개발/테스트용).
  - 모델: `ANTHROPIC_MODEL` 환경변수로 설정 가능 (기본 `claude-sonnet-4-20250514`).

- **REST 엔드포인트**
  - `POST /api/requirements/generate` — 자연어 입력 → Feature 생성 +
    DB 저장 + Work Item 자동 생성까지 한 번에.
  - `POST /api/requirements/generate/preview` — Feature 미리보기만
    (DB 저장 없이 Claude 응답 확인).

---

## [0.18.0] — 2026-04-16

### Phase 17 — Presigned URL 보안 (NFR-S-05)

#### 추가
- **`PresignedUrlService`** (`apps/api/src/common/services/`)
  - `sign(s3Key)` — HMAC-SHA256 서명 + 만료 epoch 기반 임시 URL 생성.
    기본 24시간 유효 (`PRESIGN_TTL_HOURS` 환경변수로 조절 가능).
  - `verify(s3Key, expires, sig)` — `crypto.timingSafeEqual` 로
    타이밍 공격 방지 검증.
  - 시크릿 키: `PRESIGN_SECRET` 환경변수 (프로덕션 배포 시 Secrets
    Manager에서 주입 권장).

- **`GET /api/builds/:id/download`** — 빌드의 `s3Key`에 대한
  presigned URL을 발급. 기존 `cloudfrontUrl` 직접 노출 대신 사용.

- **포털에도 동일 서비스 등록** — 포털 빌드 다운로드에서도 presigned
  URL 경유로 전환 가능하도록 `PresignedUrlService` 프로바이더 추가.

---

## [0.17.0] — 2026-04-16

### Phase 16 — 요구사항 → Work Item 자동 생성 (FR-03-05)

#### 추가
- **`RequirementsService.create()`** — 요구사항 생성 시 Feature 파일에서
  `Scenario:` 라인을 파싱하여 각 시나리오별 Work Item(STORY, BACKLOG)을
  자동 생성하고 `RequirementLink` 로 양방향 연결.
  - 시나리오가 없으면 요구사항 제목으로 1개 Work Item 생성.
  - 실패 시 로그만 남기고 요구사항 생성은 정상 완료(best-effort).

#### 참고
- FR-03-03 (PM Agent가 자연어를 Cucumber로 자동 변환)은 Claude API
  연동이 필요하여 별도 Phase로 분리.

---

## [0.16.0] — 2026-04-16

### Phase 15 — CRM 자동 알림 (FR-01-04, FR-01-05)

#### 추가
- **`CrmNotificationsService`** (`apps/api/src/crm/notifications/`)
  - `onNewOpportunity(oppId)` — 신규 영업기회 생성 시 전 활성
    프로젝트 채팅방에 `[CRM] 새 영업 기회: ...` STATUS 포스트.
  - `@Cron(EVERY_DAY_AT_9AM) checkExpiringContracts()` — 매일 09시에
    30일/7일/1일 전 만료 계약 스캔. 해당 프로젝트 + 전체 활성
    프로젝트에 만료 경고 포스트.
  - `getRecentAlerts()` — 최근 7일 신규 영업기회 + 30일 내 만료 예정
    계약 목록.

- **REST 엔드포인트**
  - `GET /api/crm/notifications` — 최근 CRM 알림 목록.
  - `GET /api/crm/notifications/check-expiring` — 만료 체크 수동 트리거.

- **`@nestjs/schedule`** + `ScheduleModule.forRoot()` 추가.

---

## [0.15.0] — 2026-04-16

### Phase 14 — 납품 보고서 PDF (FR-09-04)

#### 추가
- **`ReportPdfService`** (`apps/api/src/portal/report-pdf.service.ts`)
  - `pdfkit` 라이브러리 사용. A4 문서에 5개 섹션:
    1. 헤더 (프로젝트 이름, 플랫폼, 생성 일시)
    2. Summary (진척률, Work Items, 요구사항, 릴리스, 빌드 통계)
    3. Requirements (버전 · 상태별 목록)
    4. Releases (버전 · 상태 · 배포일 · 빌드 수)
    5. Test Runs (상태 · 일시)
    6. Footer (레포트 ID)

- **`GET /api/portal/projects/:id/report/pdf`** — `Content-Type:
  application/pdf` + `Content-Disposition: attachment` 로 PDF 바이너리
  직접 반환. JSON 보고서 엔드포인트는 그대로 유지.

- **포털 웹 UI** — 납품 보고서 탭에 JSON + PDF 다운로드 버튼 병렬 배치.

#### 수정
- `FeedbackService.autoCreateWorkItem` — `platform` 필드를 `null`로
  수정 (Prisma 스키마와 타입 일치).

---

## [0.14.0] — 2026-04-16

### Phase 13 — 배포 후 피드백 루프 (FR-10)

#### 추가
- **NestJS Feedback 모듈** (`apps/api/src/feedback/`)
  - `FeedbackService`:
    - `create()` — 피드백 저장 후 즉시 자동 분류(triage).
    - `triage()` — 키워드 기반 type 분류(BUG/FEATURE/IMPROVEMENT/
      QUESTION) + severity 분류(P0~P3). Sentry 소스는 자동 P0.
    - P0/P1 자동 Work Item 생성 → 피드백에 `workItemId` 연결.
    - `updateStatus()`, `retriage()`, `listByCustomer()`.
  - `FeedbackController`:
    - `GET /api/projects/:id/feedback` — 목록 (상태 필터).
    - `GET /api/feedback/:id` — 상세 (WorkItem 연결 포함).
    - `POST /api/projects/:id/feedback` — 제출 + 자동 분류 +
      채팅방에 STATUS 메시지("새 피드백 [BUG/P0]") 포스트.
    - `PATCH /api/feedback/:id/status` — 상태 변경.
    - `POST /api/feedback/:id/retriage` — 재분류.

- **포털 피드백 조회** — `GET /api/portal/feedback` — 고객사 소속
  모든 프로젝트의 피드백 처리 현황 (FR-10-07).

- **웹 UI** (`/projects/[id]/feedback`)
  - 피드백 목록 (type 아이콘, severity/status 뱃지, WorkItem 연결 표시).
  - 피드백 등록 폼 (제출 시 자동 분류).
  - 프로젝트 SUB_NAV에 "Feedback" 탭 추가.

#### 참고
- 벡터 유사도 검색(pgvector, FR-10-05)은 P1 후순위. 현재 DB에
  `embedding` 컬럼 주석 처리 상태; pgvector 확장 활성화 시 전환 가능.

---

## [0.13.0] — 2026-04-16

### Phase 12 — 납품 & 고객 포털 (FR-09)

#### 추가
- **PortalUser 인증** — `POST /api/auth/portal/login` — 기존
  `AuthService`에 `portalLogin()` 추가. JWT에 `customerId` 포함.

- **NestJS Portal 모듈** (`apps/api/src/portal/`)
  - `GET /api/portal/projects` — 고객사(customerId) 소속 프로젝트 목록.
  - `GET /api/portal/projects/:id/progress` — 진척률(완료/전체 Work Item),
    Work Item 통계, 최근 배포된 릴리스.
  - `GET /api/portal/projects/:id/builds` — 성공한 빌드(CloudFront URL).
  - `GET /api/portal/projects/:id/requirements` — 요구사항 목록.
  - `POST /api/portal/requirements/:id/approve` — 고객 승인.
  - `POST /api/portal/requirements/:id/reject` — 고객 반려.
  - `GET /api/portal/projects/:id/report` — 납품 보고서 JSON
    (진척 요약, 요구사항, 릴리스, 테스트, 빌드). PDF는 후속.
  - 모든 엔드포인트에서 `customerId` 기반 접근 제어.

- **고객 포털 웹 UI** (`apps/web/app/(portal)/portal/`)
  - 로그인 페이지 (`/portal/login`).
  - 포털 레이아웃 — 상단 헤더(로고 + 로그아웃).
  - `/portal` — 내 프로젝트 목록 (아이템/요구사항/릴리스 카운트).
  - `/portal/[id]` — 탭 4개:
    - **개요** — 진척률 바 + Work Item 통계 + 최근 릴리스.
    - **요구사항** — 목록 + PENDING_APPROVAL 상태에 승인/반려 버튼.
    - **빌드 다운로드** — 성공 빌드의 CloudFront 다운로드 링크.
    - **납품 보고서** — JSON 다운로드 버튼.

---

## [0.12.0] — 2026-04-16

### Phase 11 — 빌드 & 배포 관리 (FR-08)

#### 추가
- **NestJS Releases 모듈** (`apps/api/src/releases/`)
  - `ReleasesService`: 릴리스 CRUD, Work Item 연결(addWorkItems/
    removeWorkItem), 상태 전이(DRAFT→TESTING→APPROVED→DEPLOYING→
    DEPLOYED|ROLLED_BACK), 승인(테스트 검증), 빌드 트리거/업데이트,
    배포 이력 조회.
  - `DeployPipelineService`: 배포 파이프라인(테스트 검증 → 전 플랫폼
    빌드 → S3 키/CloudFront URL 생성 → 상태 완료). 각 단계를 프로젝트
    채팅에 STATUS 메시지로 포스트. 롤백 지원.
  - 빌드는 시뮬레이션(향후 DEPLOY 에이전트로 교체). S3/CloudFront
    URL은 패턴 기반 생성.
  
- **REST 엔드포인트**
  - `GET /api/projects/:id/releases` — 프로젝트 릴리스 목록
  - `POST /api/projects/:id/releases` — 릴리스 생성
  - `GET /api/releases/:id` — 릴리스 상세(items, builds, testRuns)
  - `PATCH /api/releases/:id/status` — 상태 전이
  - `POST /api/releases/:id/approve` — 승인(테스트 검증)
  - `POST /api/releases/:id/items` — Work Item 추가
  - `DELETE /api/releases/:rid/items/:wid` — Work Item 제거
  - `POST /api/releases/:id/builds` — 빌드 트리거
  - `PATCH /api/builds/:id` — 빌드 상태 업데이트
  - `POST /api/releases/:id/deploy` — 배포 파이프라인 실행
  - `POST /api/releases/:id/rollback` — 롤백
  - `GET /api/projects/:id/deploy-history` — 배포 이력

- **웹 UI** (`/projects/[id]/releases`)
  - 좌측: 릴리스 목록(상태 뱃지, 아이템/빌드 카운트) + 새 릴리스 생성 폼
  - 우측: 상세 — 상태 전이 버튼(테스트 시작/승인/배포/롤백),
    Work Items 목록, 빌드 목록(상태 아이콘 + CloudFront 다운로드 링크),
    빌드 로그 프리뷰.

---

## [0.11.0-c] — 2026-04-16

### Phase 10-C — 키워드 와치리스트

#### 추가
- **DB 모델** — `WatchKeyword` (keyword, color, active, createdBy).
  `@@unique([keyword])` 로 중복 방지.

- **WatchlistService** (`apps/api/src/admin/watchlist.service.ts`)
  - CRUD: `list()`, `listActive()`, `create()`, `update()`, `remove()`.
  - `matchAll(text, keywords)` — 텍스트에서 활성 키워드 전부 매칭.

- **AdminOpsController 확장**
  - `GET /api/admin/watchlist` — 전체 목록.
  - `POST /api/admin/watchlist` — 키워드 등록 (색상 선택: yellow/red/
    orange/green/blue/purple).
  - `PATCH /api/admin/watchlist/:id` — 색상/활성 토글.
  - `DELETE /api/admin/watchlist/:id` — 삭제.
  - 모든 CRUD에 감사 로그 기록.

- **피드 매칭** — `GET /ops/feed` 가 응답 시 각 메시지에 `watchMatches[]`
  (매칭된 키워드 + 색상)를 포함. 클라이언트에서 별도 검색 없이 즉시 표시.

- **웹 UI**
  - **와치리스트 관리 패널** — 키워드 추가(색상 드롭다운), 토글(활성/비활성),
    삭제. 칩형 태그로 현재 목록 표시.
  - **피드 하이라이트** — 매칭 메시지에 왼쪽 노란 보더, 키워드별 색상 뱃지,
    본문 내 키워드를 해당 색상으로 `<mark>` 하이라이트.
  - 검색어(`q`)와 와치리스트 키워드를 동시에 멀티 하이라이트.

---

## [0.11.0-b] — 2026-04-16

### Phase 10-B — 지연 레이더 고도화

#### 변경
- **`stalledTasks()`** — 단순 `createdAt` 비교에서 **마지막 AGENT_UPDATE
  채팅 메시지 시각** 기반으로 교체.
  - `ChatMessage` 에서 `metadata.taskId` 가 일치하는 `AGENT_UPDATE`
    레코드의 최신 `createdAt` 을 조회.
  - 업데이트가 없으면 `startedAt` → `createdAt` 으로 폴백.
  - 응답에 `lastActivityAt`, `lastUpdateBody`, `idleMinutes`,
    `progress` 필드 추가. `stalled` 플래그가 true인 것만 반환,
    `idleMinutes` 내림차순 정렬.

- **웹 UI 지연 레이더**
  - 카드형 레이아웃으로 전환 (리스트 → 카드).
  - **심각도 색상**: 60분+ → 빨강, 30분+ → 짙은 앰버, 15분+ → 옅은 앰버.
  - 각 카드에 무응답 시간(`N분 무응답`), 진행률(%), 마지막 에이전트
    메시지 프리뷰, 프로젝트 채팅방 바로가기 링크 표시.

---

## [0.11.0-a] — 2026-04-16

### Phase 10-A — Agency Ops 대시보드 + 감사 로그

#### 추가
- **DB 모델** — `AdminAuditLog` (userId, action, resource, params,
  ip, userAgent). `@@index([userId, createdAt])` + `@@index([action, createdAt])`.

- **NestJS Admin 모듈** (`apps/api/src/admin/`)
  - `AdminAuditService` — `record()` (best-effort 쓰기), `list()` 조회.
  - `AdminOpsService`:
    - `summary()` — 활성 프로젝트 수, 24h 메시지 수, 활성 태스크 수.
    - `feed(query)` — 크로스 프로젝트 채팅 피드. 키워드 검색(`q`, 대소문자 무시),
      메시지 종류 필터(`kind`), 프로젝트 필터, 커서 페이지네이션.
    - `stalledTasks(minutes)` — SUBMITTED/WORKING 상태로 N분 이상
      완료되지 않은 태스크 목록 (지연 레이더).
  - `AdminOpsController` — `@Roles(ADMIN)` + `RolesGuard`.
    - `GET /api/admin/ops/summary`
    - `GET /api/admin/ops/feed`
    - `GET /api/admin/ops/stalled`
    - `GET /api/admin/audit` — 감사 로그 조회 (본인 조회도 기록됨)
    - **모든 엔드포인트**에서 `AdminAuditService.record()` 호출.

- **웹 UI** (`/admin/ops`)
  - 요약 카드 (활성 프로젝트 · 24h 메시지 · 활성 태스크).
  - **지연 레이더** — 15분 이상 미완료 태스크를 경고 배너에 표시.
  - **크로스 프로젝트 피드** — 전체 메시지를 시간 역순으로 표시.
    키워드 검색 (하이라이트), 종류 필터 드롭다운. 15초 자동 새로고침.
  - ADMIN 아닌 사용자는 403 에러 화면.
  - 사이드바에 "Admin Ops" 항목 추가.

#### 보안
- 모든 Admin Ops 조회 시 IP, userAgent, 파라미터와 함께 감사 로그에
  기록됨. ADMIN 외 역할은 `RolesGuard`에 의해 완전 차단.

---

## [0.10.0-d] — 2026-04-16

### Phase 9-D — Demo Tour "채팅으로 작업 지시" 시나리오

#### 추가
- **시나리오 #4 — `chat-task`** (17초)
  - PM 인사 → `/task @MAC_DEV code_generation REQ-001` 슬래시 명령
    입력 → 시스템 봇이 디스패치 확인 → 에이전트가 진행률 10% → 60%
    보고 → 팀원 질문 → PM 답변 → 에이전트 100% → 시스템 봇 완료 ✓.
  - Phase 9-A/B/C에서 실제로 구현된 `/task` 파서와 에이전트 봇
    자동 포스트 흐름을 그대로 시뮬레이션.

- **`DemoPlayer` 확장**
  - 새 `chatMessage` 스텝 종류, `CalloutTarget`에 `chat` 추가.
  - "프로젝트 채팅" 패널이 `chatMessage` 스텝에서 대화 버블로 렌더.
    USER(이니셜 아바타) / AGENT(Bot 아이콘 + AGENT 배지) /
    SYSTEM(중앙 정렬 터미널 스타일) 구분. `COMMAND` kind 메시지는
    모노스페이스로 강조.

---

## [0.10.0-c] — 2026-04-15

### Phase 9-C — 슬래시 명령 + 에이전트 이벤트 자동 포스트

#### 추가
- **`/task` 슬래시 명령 파서** (`apps/api/src/chat/slash-commands.ts`)
  - 문법: `/task @AGENT_TYPE task_type [REF-ID]`
    (예: `/task @MAC_DEV code_generation REQ-001`)
  - ChatController가 `COMMAND` kind 메시지를 감지해 파싱 →
    `AgentsService.createTask()` 호출 → SYSTEM 봇 메시지로 결과 에코
    (성공/실패 모두). 파싱 실패 시 사용법 안내.
  - AgentType 화이트리스트 검증.

- **에이전트 이벤트 자동 포스트 (봇)**
  - `AgentsService.applyUpdate` → `task:update` 가 들어올 때마다
    프로젝트 채팅방에 `AGENT_UPDATE` 메시지로 진행률/메시지 포스트.
  - `AgentsService.markComplete` → 성공 시 `태스크 완료 ✓`,
    실패 시 `태스크 실패 ✗` 를 `STATUS` 메시지로 포스트.
  - 포스트는 socket.io 로 실시간 브로드캐스트 (`broadcastMessage`).
  - 채팅 포스트 실패는 로그만 남기고 에이전트 파이프라인을 막지 않음
    (taskId를 `metadata.taskId` 에 저장해 추후 연계 가능).

- **순환 의존성 해결** — `ChatModule ↔ AgentsModule` 을 `forwardRef`
  로 양방향 import. ChatGateway 는 이제 Chat 이 아닌 다른 모듈에서도
  broadcast 용도로 사용 가능.

---

## [0.10.0-b] — 2026-04-15

### Phase 9-B — 채팅 실시간 (socket.io Gateway)

#### 추가
- **`ChatGateway`** (`apps/api/src/chat/chat.gateway.ts`) —
  NestJS `@nestjs/websockets` + socket.io 네임스페이스 `/chat`.
  - 연결 시 `handshake.auth.token` 의 JWT를 검증하여
    `{ userId, email, name }` 을 `socket.data` 에 기록.
  - `room:join { projectId }` — `assertProjectAccess` 통과 시
    `project:<id>` 방에 join.
  - `room:leave { projectId }`.
  - `broadcastMessage(projectId, message)` — 해당 방에 `chat:message`
    이벤트로 메시지 푸시.

- **Controller 연동** — `POST /projects/:id/chat` 이 DB 저장 후
  즉시 `gateway.broadcastMessage()` 호출.

- **웹 클라이언트**
  - `ChatRoom` 이 `socket.io-client` 로 `/chat` 네임스페이스에 연결
    (auth 로 localStorage accessToken 전송). `chat:message` 이벤트로
    실시간 수신, 5초 폴링 제거.
  - 헤더에 `live` / `offline` 연결 상태 배지(Wifi 아이콘).
  - 내가 보낸 메시지는 POST 응답으로 즉시 반영(optimistic 유지).

- **Next.js rewrite** — `/socket.io/*` 요청을 API 로 프록시 추가
  (devtunnels·프로덕션 양쪽에서 동일한 오리진 사용).

#### 참고
- Phoenix Orchestrator 는 여전히 에이전트 전용으로 유지. 브라우저
  실시간은 NestJS 쪽에서 처리하여 JWT 정책 통합.

---

## [0.10.0-a] — 2026-04-15

### Phase 9-A — 프로젝트 채팅 (REST + 통합 인박스)

#### 추가
- **DB 모델**
  - `ChatMessage` — `projectId`, `authorType`(USER/AGENT/SYSTEM), `kind`
    (TEXT/STATUS/COMMAND/AGENT_UPDATE), `body`, `metadata`.
    `@@index([projectId, createdAt])` 로 방별 최신순 조회 최적화.
  - `ChatReadState` — 사용자별 방별 마지막 읽음 시각. 미읽음 수 계산용.
  - `Project` 관계에 `chatMessages`/`chatReads` 추가.

- **NestJS Chat 모듈** (`apps/api/src/chat/`)
  - `GET /api/projects/:id/chat` — 페이지네이션(`limit`, `before` 커서),
    최대 200건.
  - `POST /api/projects/:id/chat` — 메시지 전송. `/` 로 시작하면
    `COMMAND` kind로 저장 (Phase 9-C에서 파싱).
  - `POST /api/projects/:id/chat/read` — 미읽음 커서 업데이트.
  - `GET /api/chat/inbox` — 내가 속한 모든 프로젝트의 미읽음/최근 메시지
    집계. `projectMember` 기반 권한 필터링.

- **웹 UI**
  - `/projects/[id]/chat` — `ChatRoom` 컴포넌트. 5초 폴링(Phase 9-B에서
    WebSocket으로 교체 예정), 자동 스크롤, Enter 전송 / Shift+Enter 줄바꿈,
    USER / AGENT / SYSTEM 구분 렌더, COMMAND 메시지는 모노스페이스.
  - `/messages` — 통합 인박스. 10초 폴링으로 미읽음 뱃지·최신 프리뷰 표시.
  - 사이드바에 "Messages" 항목 추가, 프로젝트 상세 SUB_NAV에 "Chat" 추가.

#### 참고
- WebSocket 실시간 연동은 Phase 9-B, `/task` 슬래시 명령 파서 +
  에이전트 이벤트 자동 포스트는 Phase 9-C.

---

## [0.9.0-c] — 2026-04-14

### Phase 8-C — Demo 공개 경로 + Mock 에이전트 응답

#### 추가
- **비로그인 `/demo` 경로** — `app/(admin)/demo` 를 `app/(demo)/demo`
  route group으로 이동. 새 `DemoShell` 이 클라이언트에서
  `localStorage.accessToken` 유무를 확인:
  - 로그인된 사용자는 기존 admin 사이드바 레이아웃 그대로.
  - 비로그인 방문자는 상단 로고/로그인 버튼 + 하단 "시뮬레이션" 푸터의
    경량 레이아웃으로 표시.
- **에이전트 생성 코드 패널** — `agentUpdate` 스텝에 pre-baked
  SwiftUI `LoginView` 코드를 첨부하여, 실제 Claude API 호출 없이
  에이전트가 생성한 결과물을 그대로 보여줌(Mock 응답).

#### 변경
- 로그인 페이지의 "로그인" 진입 전에도 `/demo` 에서 전체 플로우를
  체험 가능.

---

## [0.9.0-b] — 2026-04-14

### Phase 8-B — Demo Tour 가이드 오버레이 + 시나리오 확장

#### 추가
- **시나리오 #2 — 버그 리포트 → 자동 수정** (`bug-triage`)
  - 고객 버그 → bug_fix 태스크 디스패치 → 원인 분석 → PR 생성 →
    리뷰 승인 → 머지까지 18초. 스택 트레이스·PR diff를 패널에 렌더.

- **시나리오 #3 — QA 자동화 실행** (`qa-run`)
  - test_generation 태스크 → iOS/Android 병렬 실행 →
    실패 테스트 분석 → 커버리지 리포트(전체 81.3%, 신규 요구사항 100%).
    플랫폼별 진행 바 시각화.

- **`CalloutOverlay`** — 각 단계의 `callout`을 화면 우하단 토스트로
  표시. `Lightbulb` 아이콘과 함께 왜 지금 이게 일어나는지 설명.
  X 버튼으로 닫을 수 있고, 단계가 바뀌면 자동 재표시.

- **패널 하이라이트** — callout의 `target`에 해당하는 패널에
  `ring-2 ring-primary` 링이 둘러져 시선이 자동으로 이동.

#### 변경
- `DemoPlayer`가 시나리오 종류에 따라 프로젝트·버그·QA 패널을
  조건부로 렌더하도록 재구성.

---

## [0.9.0-a] — 2026-04-14

### Phase 8-A — Demo Tour (샌드박스 + 시나리오 1)

#### 추가
- **데모 시나리오 엔진** (`apps/web/lib/demo/`)
  - `scenarios.ts` — 타임라인 기반 시나리오 정의 (`DemoStep`,
    `DemoScenario`). 첫 시나리오 "프로젝트 킥오프" 포함 — 프로젝트 생성
    → 요구사항 3건 입력 → 아키텍처 자동 생성 → Mac 에이전트 디스패치
    → 태스크 완료까지 22초 재생.
  - `use-demo-runner.ts` — `requestAnimationFrame` 기반 재생 엔진.
    play/pause/reset/seek/speed(0.5x–4x) 지원.

- **Demo Tour UI** (`apps/web/app/(admin)/demo/` + `components/demo/`)
  - `/demo` — 시나리오 목록 페이지.
  - `/demo/[id]` — 시나리오 플레이어. 진행률 바, 타임라인 사이드바,
    현재 단계 설명, 프로젝트/요구사항/설계 패널, 에이전트 활동 로그.
  - 설계 단계에서 기존 `MermaidViewer`로 Mermaid 다이어그램 실제 렌더.
  - 사이드바에 "Demo Tour" 항목 추가.

#### 참고
- 로그인 사용자용 학습 경로. 실제 API/DB에 쓰지 않는 **프론트엔드 전용
  시뮬레이션** (Phase 8-A 범위). Mock 에이전트 응답과 비로그인 `/demo`
  공개 경로는 Phase 8-C에서 추가 예정.

---

## [0.8.0] — 2026-04-13

### Phase 7 — Agent Client 구현 (agent-base + mac-agent)

#### 추가
- **`agent-base`** (`agents/base/src/`)
  - `AgentClient` — Phoenix Orchestrator WebSocket 클라이언트.
    Phoenix Channel wire protocol (`[joinRef, ref, topic, event, payload]`)
    구현. 자동 채널 join, heartbeat 전송 (Phoenix + channel 레벨),
    `task:dispatch` 이벤트 수신 및 `task:update`/`task:complete` 전송.
  - 자동 재연결 (5초 간격). graceful shutdown (`SIGINT`/`SIGTERM`).
  - `TaskHandler` 타입 — 에이전트별로 태스크 처리 로직을 구현하는
    async 함수 인터페이스. `TaskPayload` → `TaskResult` 반환.
  - `TaskPayload` / `TaskResult` 타입 정의.

- **`mac-agent`** (`agents/mac-agent/src/`)
  - **WebSocket 모드** (`npm run dev`) — Orchestrator에 WebSocket 연결,
    `MAC_DEV` 타입으로 등록, 태스크 자동 수신/처리.
  - **Standalone 모드** (`npm run dev:standalone`) — Orchestrator 없이
    API를 직접 폴링하여 `SUBMITTED` 상태의 `MAC_DEV` 태스크를 처리.
    JWT 로그인 → 주기적 폴링 (기본 10초).
  - `task-handler.ts` — Claude API 연동 태스크 핸들러:
    - `code_generation` / `code_review` / `bug_fix` — 코드 생성/리뷰
    - `test_generation` — XCTest 테스트 케이스 자동 생성
    - `build` — 빌드 시뮬레이션 (실제 xcodebuild 연동은 후속)
  - Claude API 키 미설정 시 **dry-run 모드**로 동작 (프롬프트 미리보기).
  - System prompt: Swift/SwiftUI/UIKit/Flutter 전문 macOS/iOS 개발자.

#### 변경
- **`apps/web/lib/api-client.ts`** — 브라우저에서 상대 경로(`''`) 사용,
  Next.js rewrites 프록시를 통해 API 호출. devtunnels 등 외부 접속 지원.
- **`apps/web/postcss.config.js`** 추가 — Tailwind CSS 컴파일 활성화.
- **`apps/web/app/page.tsx`** 추가 — 루트 경로 → `/login` 리다이렉트.
- **`apps/web/app/(admin)/projects/page.tsx`** — "New Project" 버튼에
  생성 폼 추가 (고객 선택, 이름, 설명, 플랫폼 토글, GitHub repo).
- **`apps/api/src/main.ts`** — 글로벌 `RolesGuard` 제거 (JWT 인증 전에
  role 검증되어 403 발생하던 버그 수정). CORS `origin: true`로 변경
  (devtunnels 등 외부 도메인 지원).
- **빌드 수정** — `auth.service.ts`, `jwt.strategy.ts`,
  `projects.service.ts`의 타입 캐스팅 이슈 수정.
- **`apps/web/package.json`** — 존재하지 않는 `@radix-ui/react-badge`
  의존성 제거.

#### 알려진 제약사항
- Orchestrator (Elixir)가 이 환경에서 실행 불가 — WebSocket 모드
  테스트는 Elixir 환경 필요. Standalone 모드로 API 직접 연동 가능.
- 실제 xcodebuild / Flutter 빌드 연동 미구현 — `build` 태스크는
  시뮬레이션만 수행.
- Standalone 모드의 태스크 상태 업데이트는 현재 API의 기존
  엔드포인트 구조에 맞추어야 하며, 일부 경로 조정 필요 가능.

---

## [0.7.0] — 2026-04-10

### Phase 6 — QA & 테스트 관리 (FR-07)

#### 추가
- **`QaModule`** (`apps/api/src/qa/`)
  - `QaService` — Prisma 기반 `TestCase` / `TestRun` / `TestResult` CRUD.
    `findTestCases(workItemId, platform?)`, `findTestRuns(releaseId, status?)`,
    `recordResult`, `getRunSummary` (pass/fail/skip 집계),
    `getProjectCoverage` (프로젝트 전체 테스트 커버리지 통계) 메서드 제공.
  - `createTestRun` 시 status는 `PENDING`으로 초기화.
    `updateTestRun`에서 `RUNNING`으로 변경 시 `startedAt` 자동 세팅,
    `COMPLETED`/`FAILED`로 변경 시 `endedAt` 자동 세팅.
  - `removeTestCase`는 test_results → test_case 순으로 트랜잭션 삭제.
    `removeTestRun`도 동일 패턴.
  - `QaController` (JWT 인증) —
    `GET /api/qa/test-cases?workItemId=&platform=`,
    `GET /api/qa/test-cases/:id`,
    `POST /api/qa/test-cases`,
    `PATCH /api/qa/test-cases/:id`,
    `DELETE /api/qa/test-cases/:id`,
    `GET /api/qa/test-runs?releaseId=&status=`,
    `GET /api/qa/test-runs/:id`,
    `POST /api/qa/test-runs`,
    `PATCH /api/qa/test-runs/:id`,
    `DELETE /api/qa/test-runs/:id`,
    `POST /api/qa/test-runs/:runId/results`,
    `GET /api/qa/test-runs/:runId/results`,
    `GET /api/qa/test-runs/:runId/summary`,
    `GET /api/qa/coverage/:projectId`.
  - DTO: `CreateTestCaseDto` (workItemId/title/scenario 필수, platform
    optional), `UpdateTestCaseDto`, `CreateTestRunDto` (releaseId/platform
    필수), `UpdateTestRunDto`, `RecordTestResultDto`
    (testCaseId/status 필수, duration/errorLog optional),
    `ListTestCasesQuery`, `ListTestRunsQuery`.
- **`app.module.ts`**에 `QaModule` import.
- **Admin UI — `/projects/:id/qa` 페이지**
  (`apps/web/app/(admin)/projects/[id]/qa/page.tsx`)
  - 프로젝트 커버리지 요약 카드 (커버리지 %, 테스트 케이스 수,
    커버된 Work Item 수, 전체 Work Item 수).
  - 2-column 레이아웃: 좌측 Work Item 리스트 (타입/상태 배지),
    우측 해당 Work Item의 테스트 케이스 목록.
  - 테스트 케이스 생성 폼: 제목, 시나리오 (Gherkin 스타일 placeholder),
    플랫폼 선택. 생성 후 리스트 + 커버리지 자동 갱신.
  - 기존 `SUB_NAV`의 `QA` 링크와 일치.

#### 알려진 제약사항
- TestRun은 Release에 연결되므로, Release 모듈이 없는 현재 상태에서는
  API로만 TestRun 생성 가능 (Admin UI에서는 TestCase만 관리).
  Release 모듈은 Phase 7에서 구현 예정.
- Test Agent 자동 실행 (FR-07-03)은 에이전트 실행 파이프라인 성숙 이후.
- 테스트 케이스 편집/삭제 UI 미구현. PATCH/DELETE 엔드포인트는 존재.
- TestResult의 errorLog 크기 제한 없음 — 대용량 로그 저장 시
  별도 스토리지 연동 필요 (Phase 8 이후).

---

## [0.6.1] — 2026-04-09

### Phase 3.5 — Outbox 재시도 워커 + applyUpdate 원자성

#### 추가
- **`OutboxWorker`** (`apps/api/src/agents/outbox.worker.ts`)
  - `OnModuleInit`/`OnModuleDestroy`로 관리되는 주기 `setInterval` 워커.
  - `redis_publish_failed` prefix가 붙은 `errorLog`를 가진 `SUBMITTED`
    상태 태스크를 배치로 조회해 `RedisService.publishTask`로 재발행.
  - 성공 시 `errorLog`를 `null`로 clear. 실패 시 로그 warning만 남기고
    다음 tick에 재시도.
  - `projectId`가 없는 태스크는 dispatch 불가능하므로 건너뜀 (운영자
    검토 대상).
  - 환경변수: `OUTBOX_WORKER_ENABLED` (기본 true),
    `OUTBOX_INTERVAL_MS` (기본 15000), `OUTBOX_BATCH_SIZE` (기본 25).
  - `AgentsModule` providers에 등록.

#### 변경
- `AgentsService.applyUpdate`가 단일 `$transaction`
  (`isolationLevel: Serializable`) 안에서 read-merge-write를 수행.
  이전에는 `findUnique` → merge → `update`가 비원자적이어서 Orchestrator
  콜백이 동시에 들어오면 텔레메트리가 손실될 수 있었음. 이제 DB 층에서
  직렬화되며, 충돌 시 Prisma P2034가 발생하고 호출자는 자체 재시도
  (Orchestrator의 TaskCallback은 fire-and-forget이므로 retry는 Phase 6
  outbox table로 이관 예정).
- `applyUpdate`가 `findTask`의 사전 존재 확인을 트랜잭션 내부로
  이동시켜 race 조건을 추가 제거.
- `startedAt`은 `status`가 이전에 `WORKING`이 아니었을 때만 세팅 (중복
  업데이트 방지).

#### 알려진 제약사항
- Outbox는 별도 테이블이 아닌 `agent_tasks.error_log` 기반 — 일시적
  Redis 장애에만 적합. 영구 outbox table은 Phase 6 (agent execution
  파이프라인 강화).
- Serializable 충돌 시 재시도 로직이 서비스 내부에는 없음. 실패는
  500으로 노출되며 Orchestrator 쪽에서 재시도해야 함.

---

## [0.6.0] — 2026-04-09

### Phase 5 — Design Hub (FR-06)

#### 추가
- **`DesignModule`** (`apps/api/src/design/`)
  - `DesignService` — `DesignArtifact` / `DesignArtifactVersion` CRUD.
    모든 content 변경(`mermaidCode` / `figmaUrl`)은 새 버전을 남기고
    `version` 카운터를 증가시킴 (FR-06-04, FR-06-05 — 덮어쓰기 금지).
    title-only 변경은 버전을 남기지 않음.
  - `create`는 `mermaidCode` 또는 `figmaUrl` 중 최소 하나가 있어야 함
    (`BadRequestException`).
  - `findByProject(projectId, type?)` — Design Hub 탭별 필터 지원.
  - `remove`는 versions → artifact 순으로 트랜잭션 삭제.
  - `DesignController` (JWT 인증) — `GET /api/design?projectId=&type=`,
    `GET /api/design/:id` (versions 포함), `GET /:id/versions`,
    `POST /api/design`, `PATCH /:id`, `DELETE /:id`.
  - DTO: `CreateDesignArtifactDto`, `UpdateDesignArtifactDto`.
    `ArtifactType`은 `ARCHITECTURE/ERD/WIREFRAME/FLOWCHART/SEQUENCE`.
- **`app.module.ts`**에 `DesignModule` import.
- **Admin UI — `/projects/:id/design` 페이지**
  (`apps/web/app/(admin)/projects/[id]/design/page.tsx`)
  - FR-06-06: Architecture / ERD / Wireframe / Flowchart / Sequence
    탭 분리.
  - FR-06-01: Mermaid 뷰어를 통한 미리보기. `mermaid@11.4.1` 동적
    import로 클라이언트에서만 렌더.
  - FR-06-02: 테마 전환 드롭다운 (`default/dark/forest/neutral`).
  - FR-06-03: Wireframe 탭은 Figma URL을 iframe으로 렌더.
  - 탭별 Mermaid 템플릿 pre-fill (ARCHITECTURE/ERD/FLOWCHART/SEQUENCE).
  - 2-column 레이아웃: 좌측 artifact 리스트, 우측 미리보기.
- **`components/design/mermaid-viewer.tsx`** — 재사용 가능한
  MermaidViewer 컴포넌트. `securityLevel: 'strict'`, 렌더 에러를
  붉은 박스로 표시, 동적 import로 SSR 안전.

#### 알려진 제약사항
- In-place 편집 UI 없음. PATCH 엔드포인트는 존재하므로 curl 사용 가능.
- Figma URL은 validation 없음 — 잘못된 URL도 그대로 iframe에 들어감.
  Phase 6에서 `figma.com` allowlist 추가 예정.
- UX Agent 자동 생성 (FR-06-07)은 Phase 7 이후.
- Mermaid `securityLevel: 'strict'`라 일부 고급 문법(click events 등)은
  비활성화됨.

---

## [0.5.0] — 2026-04-09

### Phase 4 — 요구사항 관리 (FR-03)

#### 추가
- **`RequirementsModule`** (`apps/api/src/requirements/`)
  - `RequirementsService` — Prisma 기반 `Requirement` / `RequirementVersion` /
    `RequirementLink` CRUD. 모든 쓰기 작업은 `$transaction` 사용.
  - Feature file 또는 title 변경 시 `RequirementVersion`에 스냅샷을
    남기고 `version`을 증가시킴 (FR-03-04 — 변경 이력 보존). status /
    platforms 만 변경되는 경우는 버전을 증가시키지 않음.
  - `create`는 Requirement + 초기 `v1` RequirementVersion을 단일
    트랜잭션으로 생성.
  - `remove`는 requirement_links → requirement_versions → requirement
    순으로 FK 제약을 만족하며 삭제.
  - `RequirementsController` (JWT 인증) —
    `GET /api/requirements?projectId=`, `GET /api/requirements/:id`
    (versions + linked work items 포함), `GET /:id/versions`,
    `POST /api/requirements`, `PATCH /:id`, `POST /:id/approve`,
    `POST /:id/links`, `DELETE /:id/links/:workItemId`, `DELETE /:id`.
  - DTO: `CreateRequirementDto` (projectId/title/featureFile/platforms
    필수), `UpdateRequirementDto` (모두 optional + changeNote),
    `ApproveRequirementDto`, `LinkWorkItemDto`. `Platform` enum은
    `MACOS/WINDOWS/IOS/ANDROID/WEB/LINUX`.
  - `@CurrentUser()`로 `changedBy` 자동 주입.
- **`app.module.ts`**에 `RequirementsModule` import.
- **Admin UI — `/projects/:id/requirements` 페이지**
  (`apps/web/app/(admin)/projects/[id]/requirements/page.tsx`) —
  요구사항 목록 + 새 요구사항 생성 폼 (제목, 플랫폼 토글, feature file
  textarea + 템플릿 pre-fill). 버전 수 / 연결된 work item 수를 카운터로
  표시. 기존 `SUB_NAV`의 `Requirements` 링크와 일치.

#### 알려진 제약사항
- Requirement 편집 UI는 미구현 (현재는 목록 + 생성만). PATCH 엔드포인트는
  존재하며 curl로 호출 가능.
- PM Agent 자동 생성 (FR-03-03)은 Phase 7 이후 — 에이전트 실행 파이프라인
  성숙 이후.
- Feature file 문법 검증 없음. 잘못된 Gherkin도 그대로 저장됨.
- linkWorkItem은 work item 존재 여부를 사전 검증하지 않음 — Prisma FK
  위반 에러가 500으로 노출됨.

---

## [0.4.0] — 2026-04-09

### Phase 3 — Orchestrator↔API 통합 마감 + Agents 모듈

#### 추가
- **`AgentsModule`** (`apps/api/src/agents/`)
  - `AgentsService` — Prisma 기반 `AgentCard` / `AgentTask` CRUD.
    `listCards`, `findCard`, `listTasks` (projectId/status/agentType
    필터), `findTask`, `createTask`, `applyUpdate`, `markComplete` 메서드
    제공.
  - `AgentsController` (JWT 인증) — `GET /api/agents`,
    `GET /api/agents/tasks/list`, `GET /api/agents/tasks/:taskId`,
    `POST /api/agents/tasks`, `GET /api/agents/:id`. 라우트 선언
    순서는 의도적 — `tasks/*`가 `:id`보다 먼저 와야 정적 세그먼트가
    가려지지 않음.
  - `InternalTasksController` (OrchestratorAuthGuard) —
    `POST /internal/tasks/:id/updates`, `POST /internal/tasks/:id/complete`.
    Phase 2 Orchestrator의 `TaskCallback` 수신처.
  - DTO: `CreateAgentTaskDto`, `TaskUpdateDto`, `TaskCompleteDto`,
    `ListAgentTasksQuery`. Orchestrator의 RedisConsumer가 `project_id`
    로 프로젝트별 라우팅하기 때문에 `CreateAgentTaskDto.projectId`는
    필수.
- **`OrchestratorAuthGuard`** (`apps/api/src/common/guards/`) —
  `Authorization: Bearer ${ORCHESTRATOR_SECRET}` 헤더를
  `crypto.timingSafeEqual`로 검증. 불일치 또는 시크릿 미설정 시
  `UnauthorizedException`.
- **`RedisModule` / `RedisService`** (`apps/api/src/common/redis/`) —
  `@Global` ioredis 래퍼. `publishTask(entry)`로 `orchestrator:tasks`
  스트림에 XADD. Wire format은 Orchestrator의 `RedisConsumer`와 정확히
  일치: top-level `project_id` + `task_id` + `payload` JSON. 라우팅
  필드(`task_id`, `agent_type`, `task_type`)는 `payload` JSON 안으로
  folding — `RedisConsumer`가 `payload`만 디코드하여
  `ProjectOrchestrator.enqueue_task/2`에 전달하기 때문.
- **`app.module.ts`**에 `RedisModule` (global) + `AgentsModule` import.
- **Admin UI — `/agents` 페이지** (`apps/web/app/(admin)/agents/page.tsx`)
  — 클라이언트 컴포넌트. 에이전트 카드(이름/타입/상태/엔드포인트)
  목록과 최근 태스크 테이블 표시. 기존 `apiClient`로 JWT 자동 주입.

#### 변경
- `CreateAgentTaskDto.projectId`가 **필수**로 변경. 누락 시 Orchestrator
  의 RedisConsumer (`with %{"project_id" => _, ...}`)가 조용히 엔트리를
  폐기하는 문제 해결.
- `AgentsService.createTask`는 XADD 실패 시 `errorLog`에
  `"redis_publish_failed: ..."`를 기록하고 업데이트된 row를 반환. 향후
  outbox 워커가 재시도 대상을 식별할 수 있도록.
- `AgentsService.applyUpdate`가 JSON merge 시 기존 값이 plain object일
  때만 spread. array / primitive 값에 대한 런타임 크래시 방지.

#### 알려진 제약사항 (Phase 3.5 / Phase 4 후속)
- Outbox 워커 미구현 — XADD 실패는 row에 마킹될 뿐 자동 재시도 없음.
- `applyUpdate`는 비원자적 (read-merge-write). 동일 태스크에 동시
  업데이트가 들어오면 텔레메트리가 손실될 수 있음. 단일
  `UPDATE ... jsonb_set`로 이관 필요.
- 이 환경에서 `npm install` 미실행 — `ioredis`는 이미
  `apps/api/package.json`에 선언되어 있어 신규 의존성은 없음. 로컬에서
  `cd apps/api && npm install && npm run build`로 검증 필요.
- Admin UI에 API 실패 에러 처리 없음 (미인증 시 빈 화면).

---

## [0.3.0] — 2026-04-09

### Phase 2 — Orchestrator 스켈레톤

#### 추가
- **Phoenix Orchestrator OTP 트리** (`apps/orchestrator/lib/`)
  - `Orchestrator.AgentRegistry` — `agent_type` 별로 온라인 에이전트를 추적하는
    GenServer. `Process.monitor`로 채널 프로세스가 죽으면 자동 제거,
    `touch/1`로 heartbeat 시각 갱신.
  - `Orchestrator.ProjectSupervisor` — 프로젝트별 오케스트레이터 프로세스를
    동적으로 기동하는 `DynamicSupervisor` (프로젝트 간 장애 격리).
  - `Orchestrator.ProjectOrchestrator` — 프로젝트 단위 `GenServer`.
    `{:via, Registry, …}` (`Orchestrator.ProjectRegistry`)로 이름 등록되며
    in-flight 작업 상태를 보유하고 디스패처로 작업을 전달.
  - `Orchestrator.RedisConsumer` — `orchestrator:tasks` 스트림을
    `XREADGROUP` 루프로 소비 (consumer group: `orchestrator`). 해당
    `ProjectOrchestrator`가 없으면 lazy-start, 처리/비처리 엔트리 모두 XACK.
  - `Orchestrator.TaskDispatcher` — `agent_type`을 보고 `AgentRegistry`에서
    round-robin으로 에이전트 선택 후, 채널 pid에 `{:dispatch_task, payload}`
    메시지를 전송.
  - `Orchestrator.HeartbeatMonitor` — 10초 주기로 스캔, `last_seen`이 30초를
    초과한 에이전트를 unregister.
- **Phoenix 웹 레이어** (`apps/orchestrator/lib/orchestrator_web/`)
  - `OrchestratorWeb.HealthController` (`GET /health`) — 온라인 에이전트 수 /
    실행 중 프로젝트 수 리포트.
  - `OrchestratorWeb.OrchestrationController` —
    `POST /api/orchestrate/:project_id/{start,stop}`,
    `GET /api/orchestrate/:project_id/status`,
    `POST /api/agents/register`.
  - `OrchestratorWeb.ErrorJSON` — `config.exs`에서 참조되는 에러 뷰.
  - `OrchestratorWeb.AgentChannel` (`agent:<agent_id>` 토픽) — join 시 채널 pid를
    `AgentRegistry`에 등록, `heartbeat`/`task:update`/`task:complete` 수신,
    디스패처가 보낸 `task:dispatch` 이벤트를 push.
- **Application 수퍼비전 트리** (`application.ex`):
  `{Registry, keys: :unique, name: Orchestrator.ProjectRegistry}` 추가 —
  `ProjectOrchestrator` via-tuple 조회 지원.
  `{Task.Supervisor, name: Orchestrator.TaskSupervisor}`도 추가 — HTTP
  콜백 비동기 실행용.
- **`Orchestrator.TaskCallback`** (`lib/orchestrator/task_callback.ex`) —
  에이전트의 `task:update` / `task:complete` 이벤트를 API 서버로
  `Req.post/2` 호출로 전달. `Orchestrator.TaskSupervisor` 하위에서
  fire-and-forget(5초 타임아웃)으로 실행. 엔드포인트:
  `POST {api_url}/internal/tasks/:task_id/updates`,
  `POST .../complete`. `Authorization: Bearer {orchestrator_secret}`
  헤더. 실패 시 로그만 남기며 재시도는 Phase 3 outbox로 이관.
- **`AgentChannel`**이 로그 대신 `TaskCallback.report_update/3` /
  `report_complete/3`를 호출하도록 변경.
- **`OrchestrationController.register_agent`**가 202 Accepted +
  `canonical_path: "/socket/websocket"` + 안내 문구 반환 (실제 등록은
  WebSocket join 경로라는 점 명시).
- **통합 테스트 스켈레톤** (`@moduletag :integration` / `:redis`,
  기본 실행에서 제외):
  - `test/support/channel_case.ex`, `test/support/conn_case.ex` —
    Phoenix 표준 테스트 case 템플릿.
  - `test/orchestrator_web/agent_channel_test.exs` — join, heartbeat,
    task:update/complete, dispatch 라우팅.
  - `test/orchestrator_web/orchestration_controller_test.exs` —
    start/stop/status/register 엔드포인트 + AuthPlug 검증.
  - `test/orchestrator/redis_consumer_test.exs` — XADD/XREADGROUP/XACK
    흐름 (라이브 Redis 필요).
  테스트 본문은 `:skip` 태그로 placeholder. 실제 fixture 연결은 Phase 3.

#### 테스트 (유닛, 외부 의존 없음)
| 테스트 파일 | 대상 모듈 | SRS FR |
|---|---|---|
| `test/orchestrator/agent_registry_test.exs` | `AgentRegistry` | FR-04-08, FR-05-01 |
| `test/orchestrator/task_dispatcher_test.exs` | `TaskDispatcher` | FR-04-01 |
| `test/orchestrator/project_supervisor_test.exs` | `ProjectSupervisor`, `ProjectOrchestrator` | FR-04-09 |
| `test/orchestrator/heartbeat_monitor_test.exs` | `HeartbeatMonitor` | FR-04-08 |

커버리지 요약:
- 에이전트 등록/조회/해제, 타입별 필터, heartbeat touch, 채널 pid
  `:DOWN` 시 자동 정리.
- N개 에이전트 round-robin 디스패치, 에이전트 부재 fallback, 기본
  `agent_type` 처리.
- 프로젝트별 수퍼비전: start, 중복 거부, stop, 프로젝트 간 장애 격리,
  status 스냅샷.
- Heartbeat sweep: stale 축출, `touch/1`로 fresh 유지.

#### 변경
- `HeartbeatMonitor`가 `:interval_ms`, `:timeout_seconds` 옵션을 받도록
  리팩터 (기본값은 10s / 30s로 동일). 동기 `sweep/1` 추가 — 테스트가
  타이머 tick을 기다리지 않고 축출 동작을 검증할 수 있도록.
- `mix.exs`의 test alias에서 `ecto.create`/`ecto.migrate`를 제거. 유닛
  테스트는 Postgres 없이 실행됨. DB 기반 테스트가 추가될 때는 별도
  integration alias를 만들 예정.
- `test/test_helper.exs`가 `ExUnit.start/0` 전에 `:orchestrator`
  애플리케이션을 중단. 테스트가 `start_supervised!`로 직접 수퍼비전
  트리를 소유하여, 자동 기동된 싱글턴(`AgentRegistry` 등)과 충돌 방지.
  이제 `:integration`, `:redis`, `:skip` 태그를 기본 제외. 통합 테스트는
  `mix test --include integration`로 실행 (Phoenix Endpoint +
  AgentRegistry 부팅 필요).
- `mix.exs` 버전 `0.1.0` → `0.3.0`으로 릴리스에 맞춰 범프.
- `config/config.exs`에 `:api_url` / `:orchestrator_secret` 기본값 선언.
  환경별 값은 `dev.exs` / `prod.exs` (`API_URL` / `ORCHESTRATOR_SECRET`)
  에서 주입.

#### 알려진 제약사항 (Phase 3 후속)
- TaskCallback은 재시도 / dead-letter 없음 — 실패 콜백은 로그만 남기고
  버림. Phase 3에서 outbox 패턴 도입.
- API 쪽 (`POST /internal/tasks/:id/updates`, `/complete`) 아직 미구현.
  Phase 3에서 해당 라우트 추가 전까지 API는 404 응답.
- 이 환경에 Elixir 툴체인 부재로 `mix compile` / `mix test` 미실행.
  로컬에서 `cd apps/orchestrator && mix deps.get && mix test` 실행 필요.
- 통합 테스트 본문은 `:skip`로 placeholder. 실제 assertion은 Phoenix
  Endpoint fixture + `Req.Test` stub 연결 후 작성.

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
