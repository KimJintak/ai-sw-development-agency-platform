const now = Date.now()

export const demoAgentCards = [
  {
    id: 'demo-agent-001', agentType: 'MAC_DEV', name: 'Mac Builder Alpha',
    description: 'SwiftUI/AppKit 코드 생성, 빌드, 테스트 에이전트',
    endpoint: 'wss://agents.internal/mac-alpha', skills: ['code_generation', 'code_review', 'bug_fix', 'build'],
    status: 'ONLINE', lastSeenAt: new Date(now - 30000).toISOString(),
  },
  {
    id: 'demo-agent-002', agentType: 'MAC_DEV', name: 'Mac Builder Beta',
    description: 'iOS/iPadOS 전용 빌드 에이전트',
    endpoint: 'wss://agents.internal/mac-beta', skills: ['code_generation', 'build', 'test_generation'],
    status: 'BUSY', lastSeenAt: new Date(now - 15000).toISOString(),
  },
  {
    id: 'demo-agent-003', agentType: 'WINDOWS_DEV', name: 'Win Builder',
    description: 'Windows .NET / WPF 개발 에이전트',
    endpoint: 'wss://agents.internal/win-01', skills: ['code_generation', 'build'],
    status: 'ONLINE', lastSeenAt: new Date(now - 60000).toISOString(),
  },
  {
    id: 'demo-agent-004', agentType: 'AWS_DEV', name: 'Cloud Deployer',
    description: 'AWS 인프라 프로비저닝 및 배포 에이전트',
    endpoint: 'wss://agents.internal/aws-01', skills: ['deploy', 'infra_setup'],
    status: 'ONLINE', lastSeenAt: new Date(now - 45000).toISOString(),
  },
  {
    id: 'demo-agent-005', agentType: 'ARCHITECTURE', name: 'Arch Reviewer',
    description: '아키텍처 설계 리뷰 및 다이어그램 생성',
    endpoint: 'wss://agents.internal/arch-01', skills: ['code_review', 'design_generation'],
    status: 'ONLINE', lastSeenAt: new Date(now - 20000).toISOString(),
  },
  {
    id: 'demo-agent-006', agentType: 'TEST', name: 'QA Runner',
    description: '크로스플랫폼 테스트 실행 및 리포트 생성',
    endpoint: 'wss://agents.internal/test-01', skills: ['test_generation', 'test_execution'],
    status: 'BUSY', lastSeenAt: new Date(now - 10000).toISOString(),
  },
  {
    id: 'demo-agent-007', agentType: 'TRIAGE', name: 'Bug Triager',
    description: '피드백/버그 자동 분류 에이전트',
    endpoint: 'wss://agents.internal/triage-01', skills: ['triage', 'classification'],
    status: 'OFFLINE', lastSeenAt: new Date(now - 3600000).toISOString(),
  },
  {
    id: 'demo-agent-008', agentType: 'PM', name: 'PM Assistant',
    description: '자연어 → Cucumber 변환, 요구사항 분석',
    endpoint: 'wss://agents.internal/pm-01', skills: ['requirement_generation', 'analysis'],
    status: 'ERROR', lastSeenAt: new Date(now - 7200000).toISOString(),
  },
]

export const demoAgentTasks = [
  {
    id: 'demo-task-001', taskType: 'code_generation', status: 'COMPLETED',
    createdAt: new Date(now - 2 * 3600000).toISOString(),
    agentCard: { id: 'demo-agent-001', agentType: 'MAC_DEV', name: 'Mac Builder Alpha' },
  },
  {
    id: 'demo-task-002', taskType: 'code_review', status: 'COMPLETED',
    createdAt: new Date(now - 4 * 3600000).toISOString(),
    agentCard: { id: 'demo-agent-005', agentType: 'ARCHITECTURE', name: 'Arch Reviewer' },
  },
  {
    id: 'demo-task-003', taskType: 'build', status: 'WORKING',
    createdAt: new Date(now - 30 * 60000).toISOString(),
    agentCard: { id: 'demo-agent-002', agentType: 'MAC_DEV', name: 'Mac Builder Beta' },
  },
  {
    id: 'demo-task-004', taskType: 'test_execution', status: 'WORKING',
    createdAt: new Date(now - 20 * 60000).toISOString(),
    agentCard: { id: 'demo-agent-006', agentType: 'TEST', name: 'QA Runner' },
  },
  {
    id: 'demo-task-005', taskType: 'bug_fix', status: 'COMPLETED',
    createdAt: new Date(now - 8 * 3600000).toISOString(),
    agentCard: { id: 'demo-agent-001', agentType: 'MAC_DEV', name: 'Mac Builder Alpha' },
  },
  {
    id: 'demo-task-006', taskType: 'deploy', status: 'COMPLETED',
    createdAt: new Date(now - 24 * 3600000).toISOString(),
    agentCard: { id: 'demo-agent-004', agentType: 'AWS_DEV', name: 'Cloud Deployer' },
  },
  {
    id: 'demo-task-007', taskType: 'code_generation', status: 'FAILED',
    createdAt: new Date(now - 6 * 3600000).toISOString(),
    agentCard: { id: 'demo-agent-008', agentType: 'PM', name: 'PM Assistant' },
  },
  {
    id: 'demo-task-008', taskType: 'test_generation', status: 'SUBMITTED',
    createdAt: new Date(now - 10 * 60000).toISOString(),
    agentCard: { id: 'demo-agent-006', agentType: 'TEST', name: 'QA Runner' },
  },
]
