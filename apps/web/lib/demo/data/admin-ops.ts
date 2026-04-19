const now = Date.now()

export const demoOpsSummary = {
  projectCount: 4,
  messageCount24h: 47,
  activeTaskCount: 6,
}

export const demoStalled = [
  {
    id: 'demo-task-003',
    taskType: 'build',
    status: 'WORKING',
    createdAt: new Date(now - 45 * 60000).toISOString(),
    agentCard: { agentType: 'MAC_DEV', name: 'Mac Builder Beta' },
    project: { id: 'demo-proj-001', name: 'SwiftBoard - macOS 태스크 매니저' },
    lastActivityAt: new Date(now - 22 * 60000).toISOString(),
    lastUpdateBody: 'Xcode build 진행 중... (40%)',
    idleMinutes: 22,
    progress: 0.4,
  },
  {
    id: 'demo-task-004',
    taskType: 'test_execution',
    status: 'WORKING',
    createdAt: new Date(now - 35 * 60000).toISOString(),
    agentCard: { agentType: 'TEST', name: 'QA Runner' },
    project: { id: 'demo-proj-002', name: 'CloudSync - 크로스플랫폼 파일동기화' },
    lastActivityAt: new Date(now - 18 * 60000).toISOString(),
    lastUpdateBody: 'E2E 테스트 실행 중... 12/24 완료',
    idleMinutes: 18,
    progress: 0.5,
  },
]

export const demoWatchKeywords = [
  { id: 'demo-wk-001', keyword: '긴급', color: 'red', active: true, createdAt: new Date(now - 30 * 86400000).toISOString() },
  { id: 'demo-wk-002', keyword: 'error', color: 'orange', active: true, createdAt: new Date(now - 20 * 86400000).toISOString() },
  { id: 'demo-wk-003', keyword: 'timeout', color: 'yellow', active: true, createdAt: new Date(now - 10 * 86400000).toISOString() },
]

export const demoFeed = [
  {
    id: 'demo-feed-01', projectId: 'demo-proj-001',
    project: { id: 'demo-proj-001', name: 'SwiftBoard' },
    authorType: 'AGENT', authorName: 'MAC_DEV 에이전트', kind: 'AGENT_UPDATE',
    body: '코드 생성 완료. PR #42 생성됨. (100%)',
    createdAt: new Date(now - 25 * 60000).toISOString(), watchMatches: [],
  },
  {
    id: 'demo-feed-02', projectId: 'demo-proj-001',
    project: { id: 'demo-proj-001', name: 'SwiftBoard' },
    authorType: 'SYSTEM', authorName: 'System', kind: 'STATUS',
    body: '태스크 완료 ✓ — PR #42 열림 (KanbanBoardView.swift)',
    createdAt: new Date(now - 24 * 60000).toISOString(), watchMatches: [],
  },
  {
    id: 'demo-feed-03', projectId: 'demo-proj-002',
    project: { id: 'demo-proj-002', name: 'CloudSync' },
    authorType: 'USER', authorName: 'PM 박서준', kind: 'COMMAND',
    body: '/task @ARCHITECTURE code_review REQ-203',
    createdAt: new Date(now - 130 * 60000).toISOString(), watchMatches: [],
  },
  {
    id: 'demo-feed-04', projectId: 'demo-proj-002',
    project: { id: 'demo-proj-002', name: 'CloudSync' },
    authorType: 'AGENT', authorName: 'ARCHITECTURE 에이전트', kind: 'AGENT_UPDATE',
    body: '리뷰 완료. 키 로테이션 정책 추가 권장.',
    createdAt: new Date(now - 60 * 60000).toISOString(), watchMatches: [],
  },
  {
    id: 'demo-feed-05', projectId: 'demo-proj-001',
    project: { id: 'demo-proj-001', name: 'SwiftBoard' },
    authorType: 'USER', authorName: '이소라', kind: 'TEXT',
    body: '긴급: Apple ID 로그인 테스트 중 크래시 발생! EXC_BAD_ACCESS',
    createdAt: new Date(now - 40 * 60000).toISOString(),
    watchMatches: [{ keyword: '긴급', color: 'red' }],
  },
  {
    id: 'demo-feed-06', projectId: 'demo-proj-001',
    project: { id: 'demo-proj-001', name: 'SwiftBoard' },
    authorType: 'AGENT', authorName: 'MAC_DEV 에이전트', kind: 'AGENT_UPDATE',
    body: 'error: Build failed — missing provisioning profile for target SwiftBoard-iOS',
    createdAt: new Date(now - 22 * 60000).toISOString(),
    watchMatches: [{ keyword: 'error', color: 'orange' }],
  },
  {
    id: 'demo-feed-07', projectId: 'demo-proj-002',
    project: { id: 'demo-proj-002', name: 'CloudSync' },
    authorType: 'AGENT', authorName: 'QA Runner', kind: 'AGENT_UPDATE',
    body: 'E2E 테스트 timeout — FileUploadTest.testLargeChunk (30초 초과)',
    createdAt: new Date(now - 18 * 60000).toISOString(),
    watchMatches: [{ keyword: 'timeout', color: 'yellow' }],
  },
  {
    id: 'demo-feed-08', projectId: 'demo-proj-003',
    project: { id: 'demo-proj-003', name: 'MediTrack' },
    authorType: 'SYSTEM', authorName: 'System', kind: 'STATUS',
    body: '프로젝트 상태가 ON_HOLD로 변경되었습니다.',
    createdAt: new Date(now - 200 * 60000).toISOString(), watchMatches: [],
  },
  {
    id: 'demo-feed-09', projectId: 'demo-proj-001',
    project: { id: 'demo-proj-001', name: 'SwiftBoard' },
    authorType: 'USER', authorName: 'PM 김지훈', kind: 'TEXT',
    body: '오늘 스프린트 목표: 로그인 모듈 QA 마무리, 칸반 드래그앤드롭 PR 리뷰 완료.',
    createdAt: new Date(now - 120 * 60000).toISOString(), watchMatches: [],
  },
  {
    id: 'demo-feed-10', projectId: 'demo-proj-004',
    project: { id: 'demo-proj-004', name: 'FinLedger' },
    authorType: 'SYSTEM', authorName: 'System', kind: 'STATUS',
    body: '릴리스 v1.0.0 배포 완료. 상태: DEPLOYED',
    createdAt: new Date(now - 2 * 86400000).toISOString(), watchMatches: [],
  },
]
