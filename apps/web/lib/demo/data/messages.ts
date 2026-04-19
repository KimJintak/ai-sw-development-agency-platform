const now = Date.now()

export const demoInboxItems = [
  {
    projectId: 'demo-proj-001',
    projectName: 'SwiftBoard - macOS 태스크 매니저',
    unreadCount: 3,
    lastReadAt: new Date(now - 3600000).toISOString(),
    latestMessage: {
      authorName: 'PM 김지훈',
      body: '좋아요! PR 리뷰하고 내일 오전까지 머지하겠습니다.',
      createdAt: new Date(now - 15 * 60000).toISOString(),
      kind: 'TEXT',
    },
  },
  {
    projectId: 'demo-proj-002',
    projectName: 'CloudSync - 크로스플랫폼 파일동기화',
    unreadCount: 1,
    lastReadAt: new Date(now - 7200000).toISOString(),
    latestMessage: {
      authorName: 'PM 박서준',
      body: 'Windows 트레이 앱은 다음 스프린트로 미룹시다. 암호화가 우선.',
      createdAt: new Date(now - 20 * 60000).toISOString(),
      kind: 'TEXT',
    },
  },
  {
    projectId: 'demo-proj-003',
    projectName: 'MediTrack - 헬스케어 앱',
    unreadCount: 0,
    lastReadAt: new Date(now - 86400000).toISOString(),
    latestMessage: {
      authorName: 'PM 정하윤',
      body: '감사 준비 완료될 때까지 기능 개발은 일시 중단합니다.',
      createdAt: new Date(now - 195 * 60000).toISOString(),
      kind: 'TEXT',
    },
  },
  {
    projectId: 'demo-proj-004',
    projectName: 'FinLedger - 금융 대시보드',
    unreadCount: 0,
    lastReadAt: new Date(now - 2 * 86400000).toISOString(),
    latestMessage: {
      authorName: 'PM 윤서영',
      body: '고객사 FinCore에 인수 완료 이메일 발송했습니다. 프로젝트 클로즈합니다.',
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      kind: 'TEXT',
    },
  },
]
