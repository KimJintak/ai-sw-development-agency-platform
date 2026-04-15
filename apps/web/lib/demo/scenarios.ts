export type DemoStepKind =
  | 'narration'
  | 'createProject'
  | 'addRequirement'
  | 'generateDesign'
  | 'dispatchTask'
  | 'agentUpdate'
  | 'taskComplete'
  | 'bugReport'
  | 'autoFix'
  | 'reviewApproved'
  | 'testRun'
  | 'testReport'

export type CalloutTarget =
  | 'project'
  | 'requirements'
  | 'design'
  | 'agent'
  | 'qa'
  | 'bugs'

export interface DemoStep {
  at: number
  kind: DemoStepKind
  title: string
  detail?: string
  data?: Record<string, unknown>
  callout?: { target: CalloutTarget; message: string }
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
      callout: {
        target: 'project',
        message: '프로젝트는 고객사 + 타겟 플랫폼 + Git 레포가 하나의 단위로 묶여 관리됩니다.',
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
      callout: {
        target: 'requirements',
        message: 'BDD(Gherkin)으로 작성된 요구사항은 그대로 QA 테스트 케이스의 원본이 됩니다.',
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
      callout: {
        target: 'design',
        message: '요구사항을 분석해 Orchestrator가 Mermaid 아키텍처 초안을 자동 생성합니다.',
      },
    },
    {
      at: 16_500,
      kind: 'dispatchTask',
      title: 'Mac 에이전트에 태스크 디스패치',
      detail: 'SwiftUI 로그인 화면 코드 생성 태스크가 MAC_DEV 에이전트에 할당됩니다.',
      data: { agent: 'MAC_DEV', taskType: 'code_generation', reqId: 'REQ-001' },
      callout: {
        target: 'agent',
        message: 'Orchestrator가 작업을 에이전트에게 전달하고, WebSocket으로 진행 상황을 받습니다.',
      },
    },
    {
      at: 18_500,
      kind: 'agentUpdate',
      title: '에이전트 진행 보고',
      detail: 'task:update — "LoginView.swift 생성 중..."',
      data: {
        generatedCode:
          'import SwiftUI\n\nstruct LoginView: View {\n  @StateObject private var vm = LoginViewModel()\n\n  var body: some View {\n    VStack(spacing: 16) {\n      TextField("이메일", text: $vm.email)\n      SecureField("비밀번호", text: $vm.password)\n      Button("로그인") { Task { await vm.submit() } }\n        .disabled(!vm.canSubmit)\n    }\n    .padding()\n  }\n}',
        file: 'LoginView.swift',
      },
    },
    {
      at: 20_500,
      kind: 'taskComplete',
      title: '태스크 완료',
      detail: 'PR이 열리고 QA 테스트 케이스가 자동 생성되었습니다.',
    },
  ],
}

export const bugTriageScenario: DemoScenario = {
  id: 'bug-triage',
  title: '버그 리포트 → 자동 수정',
  summary: '고객이 제출한 버그가 에이전트에 의해 분석·수정되고, 리뷰를 거쳐 머지되는 흐름.',
  durationMs: 18_000,
  steps: [
    {
      at: 0,
      kind: 'narration',
      title: '버그 유입',
      detail: '고객 포털에서 로그인 크래시 리포트가 도착했습니다.',
    },
    {
      at: 1500,
      kind: 'bugReport',
      title: 'BUG-214: 로그인 크래시',
      detail: '스택 트레이스 + 재현 스텝 + 디바이스 정보 첨부',
      data: {
        id: 'BUG-214',
        severity: 'HIGH',
        title: '빈 비밀번호 입력 시 앱 크래시',
        stack: 'LoginViewModel.swift:42\nforce-unwrap password!',
      },
      callout: {
        target: 'bugs',
        message: '심각도(HIGH)는 자동 분류되며, 스택 트레이스가 에이전트 컨텍스트로 함께 전달됩니다.',
      },
    },
    {
      at: 5000,
      kind: 'dispatchTask',
      title: '에이전트에 bug_fix 태스크 디스패치',
      data: { agent: 'MAC_DEV', taskType: 'bug_fix', bugId: 'BUG-214' },
      callout: {
        target: 'agent',
        message: 'bug_fix 태스크 유형은 스택 트레이스·소스 컨텍스트를 함께 묶어 에이전트에 전달합니다.',
      },
    },
    {
      at: 8000,
      kind: 'agentUpdate',
      title: '원인 분석 중',
      detail: 'password!의 강제 언랩을 `guard let`으로 교체 제안',
    },
    {
      at: 11_000,
      kind: 'autoFix',
      title: 'PR #317 자동 생성',
      detail: 'LoginViewModel.swift — 3줄 변경, 테스트 1건 추가',
      data: {
        pr: 317,
        diff:
          '- let pwd = password!\n+ guard let pwd = password, !pwd.isEmpty else {\n+   return .invalidInput\n+ }',
      },
    },
    {
      at: 14_000,
      kind: 'reviewApproved',
      title: '리뷰 승인 & 머지',
      detail: 'Senior iOS 개발자가 PR을 검토하고 승인했습니다.',
      callout: {
        target: 'bugs',
        message: '모든 자동 수정은 사람의 리뷰 승인을 거친 뒤에야 머지됩니다 — 품질 게이트 유지.',
      },
    },
    {
      at: 16_500,
      kind: 'taskComplete',
      title: 'BUG-214 해결',
      detail: '고객에게 수정 사항이 자동 알림됩니다.',
    },
  ],
}

export const qaRunScenario: DemoScenario = {
  id: 'qa-run',
  title: 'QA 자동화 실행',
  summary: '요구사항 기반 테스트 케이스 생성 → 전 플랫폼 실행 → 커버리지 리포트.',
  durationMs: 16_000,
  steps: [
    {
      at: 0,
      kind: 'narration',
      title: 'QA 실행 시작',
      detail: 'Sprint 4의 회귀 테스트를 돌립니다.',
    },
    {
      at: 1500,
      kind: 'dispatchTask',
      title: 'test_generation 태스크 디스패치',
      data: { agent: 'MAC_DEV', taskType: 'test_generation' },
      callout: {
        target: 'qa',
        message: '각 요구사항(Gherkin)에서 XCTest 케이스를 자동 생성합니다.',
      },
    },
    {
      at: 4500,
      kind: 'testRun',
      title: '테스트 실행 중 (iOS)',
      detail: '24 / 32 통과...',
      data: { platform: 'iOS', passed: 24, total: 32 },
    },
    {
      at: 7500,
      kind: 'testRun',
      title: '테스트 실행 중 (Android)',
      detail: '28 / 32 통과...',
      data: { platform: 'Android', passed: 28, total: 32 },
    },
    {
      at: 10_500,
      kind: 'agentUpdate',
      title: '실패 테스트 분석',
      detail: 'CheckoutFlowTests.testApplePay — 타임아웃',
    },
    {
      at: 13_500,
      kind: 'testReport',
      title: '커버리지 리포트 생성',
      detail: '전체 81.3%, 신규 요구사항 커버리지 100%',
      data: { coverage: 81.3, newCoverage: 100 },
      callout: {
        target: 'qa',
        message: '커버리지는 요구사항 단위로도 집계되어, 미검증 요구사항을 즉시 식별할 수 있습니다.',
      },
    },
    {
      at: 15_000,
      kind: 'taskComplete',
      title: 'QA 실행 완료',
      detail: 'Slack으로 실패 테스트 요약이 전송되었습니다.',
    },
  ],
}

export const scenarios: DemoScenario[] = [
  projectKickoffScenario,
  bugTriageScenario,
  qaRunScenario,
]
