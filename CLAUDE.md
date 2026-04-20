# CLAUDE.md

모든 Claude Code 세션이 이 프로젝트에서 자동으로 로드하는 기준 문서입니다.
간결하게 유지하세요(200줄 이내 권장) — 값어치 낮은 정보는 `docs/`로.

---

## 프로젝트 개요

AI 에이전트가 요구사항 수집→설계→개발→QA→배포→운영→피드백 전 과정을 수행하는
소프트웨어 외주 개발 SaaS 플랫폼. 모노레포(pnpm + turborepo) 구성.

상세 상태·히스토리: [`CHANGELOG_AI_HANDOFF_KR.md`](./CHANGELOG_AI_HANDOFF_KR.md)
(EN: [`CHANGELOG_AI_HANDOFF.md`](./CHANGELOG_AI_HANDOFF.md)).
요구사항: [`docs/requirements/SRS-v0.1.md`](./docs/requirements/SRS-v0.1.md).

## 디렉터리 요약

- `apps/api/` — NestJS 11 + Prisma + PostgreSQL + Redis
- `apps/web/` — Next.js 15 내부 운영 콘솔
- `apps/portal/` — Next.js 15 고객사 포털
- `apps/orchestrator/` — Elixir/Phoenix 작업 분배
- `agents/base/` — 공용 에이전트 런타임 (`LlmService` 헬퍼 포함)
- `agents/{triage,mac,windows,aws}-agent/` — 전문화된 에이전트
- `packages/shared-types`, `packages/ui` — 공용

## 자주 쓰는 명령

```bash
pnpm dev                                     # 전체 turbo
pnpm --filter api dev                        # API only
pnpm --filter web dev                        # Web only (:3000)
pnpm --filter api db:migrate                 # Prisma migrate
pnpm --filter api db:seed
pnpm --filter api exec tsc --noEmit          # 타입체크
pnpm --filter agent-base exec tsc --noEmit
```

스모크 테스트:
```bash
node --env-file=.env apps/api/scripts/smoke-llm.mjs <task>
# task: default | pm | triage | summarize | code | test
```

## LLM 프로바이더 라우팅

코드에서 LLM 호출은 **반드시** `LlmService` (apps/api) 또는 `agent-base`의
`modelFor(task)` 경유. 직접 `@anthropic-ai/sdk` 호출 금지.

- `<provider>:<modelId>` 형식 (`LLM_MODEL_<TASK>` env)
- 지원: `anthropic` · `openai` · `google` · `openrouter` · `bedrock`
- **Bedrock 최신 Claude는 `us.` prefix 필수**
  (예: `bedrock:us.anthropic.claude-sonnet-4-5-20250929-v1:0`)
- EC2 IAM Role 사용 시 `.env`에서 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
  줄을 **완전히 제거** (빈 문자열도 IMDS 탐지를 가로막음)

## 코드 규칙

- TypeScript strict. 모든 새 코드는 `tsc --noEmit` 통과해야 함.
- 주석은 _why_ 만. _what_ 은 코드·이름이 말하게.
- NestJS 서비스는 DI 우선. 싱글턴 글로벌 지양.
- Prisma 모델 추가 시 `pnpm --filter api exec prisma generate` 잊지 말 것.
- React 컴포넌트: Server Components 기본, Client는 `'use client'` 명시.

## Git / 커밋

- **Conventional Commits**: `feat(scope): ...`, `fix(scope): ...`, `docs: ...`
- 커밋 분할: 논리 단위 한 개 = 커밋 한 개 (mixed diff 지양)
- Author identity는 `KimJintak <runkorean21@gmail.com>` — 필요 시 env vars:
  ```bash
  GIT_AUTHOR_NAME="KimJintak" GIT_AUTHOR_EMAIL="runkorean21@gmail.com" \
    GIT_COMMITTER_NAME="KimJintak" GIT_COMMITTER_EMAIL="runkorean21@gmail.com" \
    git commit ...
  ```
- CHANGELOG 업데이트: 기능 머지 시 `CHANGELOG_AI_HANDOFF*.md` 의
  `[미출시]` 섹션, 릴리스 시 버전 섹션으로 이동.

## 크로스디바이스 워크플로

개발은 4개 디바이스(AWS EC2 / Mac mini / Windows / 기타) 순환 사용.
다음이 자동 동기화:

- **`.claude/settings.json`** — 권한·훅을 모든 디바이스 공유 (git tracked)
- **`CLAUDE.md`** — 이 파일 자체
- **`.claude/progress.md`** — `Stop` 훅이 세션 종료마다 자동 추가 + 자동
  commit + `pull --rebase` + push (progress.md 만 대상; 다른 파일 절대
  함께 커밋되지 않음). 충돌·에러는 조용히 건너뜀, 로그는
  `.claude/hooks/.last-sync.log` (gitignore). 자동 push 끄려면
  `export CLAUDE_AUTO_PUSH=0`.
- **`SessionStart` 훅** — 세션 시작 시 최근 40줄 progress 노출 + 원격 ahead/behind
  알림

자동 동기화되지 않는 것 (각 디바이스 개별):
- `~/.claude/projects/.../sessions/*.jsonl` (세션 전사)
- `~/.claude/projects/.../memory/` (auto memory)
- `.claude/settings.local.json` (개인 override, gitignore)

디바이스 전환 루틴: 새 디바이스에서 시작하면 자동으로 git 상태가 보임.
필요시 `git pull` → 작업 → 종료(`Stop` 훅이 progress 기록) → 수동 `git commit`
→ `git push`.

## 환경 변수

- 저장소에는 `.env.example` (43+ 키) 만 커밋, `.env`는 gitignore
- 여러 디바이스 동기화는 1Password CLI · Doppler · AWS Secrets Manager 권장
- AWS 자격 우선순위: env > `~/.aws/credentials` > EC2 IAM Role (IMDS) —
  SDK는 `fromNodeProviderChain`이 해상

## 알려진 gotcha

1. `@ai-sdk/amazon-bedrock`은 `aws4fetch` 기반 — AWS SDK credential chain
   자동 해상 X. `createAmazonBedrock({ credentialProvider: fromNodeProviderChain() })`
   명시 주입 필수 (이미 `LlmService`에 반영됨).
2. `.env`의 빈 문자열 `AWS_ACCESS_KEY_ID=""`도 IMDS를 가림 → 줄 자체 제거.
3. 최신 Claude (4/4.5)는 Bedrock foundation-model ID 직접 호출 불가 →
   `us./eu./apac.` inference profile prefix.
4. Anthropic Max 구독은 Claude.ai + Claude Code CLI 전용 — SaaS 백엔드의
   LLM 연료로는 ToS 위반. Bedrock 경로로 갈 것.
