export type DemoStepKind =
  | 'narration'
  | 'createProject'
  | 'addRequirement'
  | 'generateDesign'
  | 'dispatchTask'
  | 'agentUpdate'
  | 'taskComplete'

export interface DemoStep {
  at: number
  kind: DemoStepKind
  title: string
  detail?: string
  data?: Record<string, unknown>
}

export interface DemoScenario {
  id: string
  title: string
  summary: string
  durationMs: number
  steps: DemoStep[]
}

export const projectKickoffScenario: DemoScenario = {
  id: 'project-kickoff',
  title: '프로젝트 킥오프',
  summary: '새 프로젝트를 만들고, 요구사항 3건을 입력한 뒤 설계가 자동 생성되는 전체 흐름을 보여줍니다.',
  durationMs: 22_000,
  steps: [
    {
      at: 0,
      kind: 'narration',
      title: '데모 시작',
      detail: '고객사 "Acme Corp"의 모바일 주문 앱 프로젝트를 준비합니다.',
    },
    {
      at: 1500,
      kind: 'createProject',
      title: '프로젝트 생성',
      detail: 'PM이 새 프로젝트를 등록합니다.',
      data: {
        name: 'Acme Mobile Ordering',
        customer: 'Acme Corp',
        platforms: ['iOS', 'Android'],
        repo: 'acme/mobile-ordering',
      },
    },
    {
      at: 4500,
      kind: 'addRequirement',
      title: '요구사항 #1 — 로그인',
      detail: 'Gherkin 포맷으로 BDD 시나리오 등록.',
      data: {
        id: 'REQ-001',
        title: '사용자 로그인',
        text: 'Feature: Login\n  Scenario: Email + 비밀번호 로그인\n    Given 가입된 이메일이 있을 때\n    When 올바른 비밀번호를 입력하면\n    Then 대시보드로 이동한다',
      },
    },
    {
      at: 7500,
      kind: 'addRequirement',
      title: '요구사항 #2 — 메뉴 탐색',
      data: {
        id: 'REQ-002',
        title: '카테고리별 메뉴 탐색',
        text: 'Feature: Menu Browse\n  Scenario: 카테고리 필터\n    Given 카테고리 목록이 표시될 때\n    When 카테고리를 선택하면\n    Then 해당 메뉴만 보인다',
      },
    },
    {
      at: 10_500,
      kind: 'addRequirement',
      title: '요구사항 #3 — 주문 결제',
      data: {
        id: 'REQ-003',
        title: '장바구니 결제',
        text: 'Feature: Checkout\n  Scenario: Apple Pay 결제\n    Given 장바구니에 상품이 있을 때\n    When Apple Pay로 결제하면\n    Then 주문 확인 화면이 표시된다',
      },
    },
    {
      at: 13_500,
      kind: 'generateDesign',
      title: '아키텍처 다이어그램 자동 생성',
      detail: 'Orchestrator가 요구사항을 읽어 Mermaid 다이어그램을 생성합니다.',
      data: {
        type: 'ARCHITECTURE',
        mermaid:
          'flowchart LR\n  U[Mobile App] -->|REST| G[API Gateway]\n  G --> A[Auth Service]\n  G --> M[Menu Service]\n  G --> O[Order Service]\n  O --> P[(Payments)]\n  M --> D[(MenuDB)]\n  O --> Q[(OrderDB)]',
      },
    },
    {
      at: 16_500,
      kind: 'dispatchTask',
      title: 'Mac 에이전트에 태스크 디스패치',
      detail: 'SwiftUI 로그인 화면 코드 생성 태스크가 MAC_DEV 에이전트에 할당됩니다.',
      data: { agent: 'MAC_DEV', taskType: 'code_generation', reqId: 'REQ-001' },
    },
    {
      at: 18_500,
      kind: 'agentUpdate',
      title: '에이전트 진행 보고',
      detail: 'task:update — "LoginView.swift 생성 중..."',
    },
    {
      at: 20_500,
      kind: 'taskComplete',
      title: '태스크 완료',
      detail: 'PR이 열리고 QA 테스트 케이스가 자동 생성되었습니다.',
    },
  ],
}

export const scenarios: DemoScenario[] = [projectKickoffScenario]
