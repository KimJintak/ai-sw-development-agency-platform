const now = Date.now()

function msg(id: string, projectId: string, authorType: string, authorName: string, kind: string, body: string, minutesAgo: number) {
  return {
    id,
    projectId,
    authorType,
    authorId: `demo-user-${authorType.toLowerCase()}`,
    authorName,
    kind,
    body,
    metadata: null,
    createdAt: new Date(now - minutesAgo * 60000).toISOString(),
  }
}

const chatData: Record<string, ReturnType<typeof msg>[]> = {
  'demo-proj-001': [
    msg('demo-chat-101', 'demo-proj-001', 'USER', 'PM 김지훈', 'TEXT', '오늘 스프린트 목표: 로그인 모듈 QA 마무리, 칸반 드래그앤드롭 PR 리뷰 완료.', 120),
    msg('demo-chat-102', 'demo-proj-001', 'USER', '이소라', 'TEXT', '로그인 QA 테스트 케이스 5건 중 3건 통과했어요. 나머지 2건 확인 중입니다.', 95),
    msg('demo-chat-103', 'demo-proj-001', 'USER', 'PM 김지훈', 'COMMAND', '/task @MAC_DEV code_generation REQ-102', 80),
    msg('demo-chat-104', 'demo-proj-001', 'SYSTEM', 'System', 'STATUS', '태스크 디스패치 완료 → @MAC_DEV · code_generation · REQ-102', 79),
    msg('demo-chat-105', 'demo-proj-001', 'AGENT', 'MAC_DEV 에이전트', 'AGENT_UPDATE', '요구사항 분석 중... KanbanBoardView.swift 생성 시작 (10%)', 70),
    msg('demo-chat-106', 'demo-proj-001', 'AGENT', 'MAC_DEV 에이전트', 'AGENT_UPDATE', 'KanbanBoardView.swift 드래그앤드롭 로직 구현 중... (55%)', 50),
    msg('demo-chat-107', 'demo-proj-001', 'USER', '이소라', 'TEXT', 'Apple ID 로그인 테스트 전부 통과! PR 리뷰 요청드려요.', 35),
    msg('demo-chat-108', 'demo-proj-001', 'AGENT', 'MAC_DEV 에이전트', 'AGENT_UPDATE', '코드 생성 완료. PR #42 생성됨. (100%)', 25),
    msg('demo-chat-109', 'demo-proj-001', 'SYSTEM', 'System', 'STATUS', '태스크 완료 ✓ — PR #42 열림 (KanbanBoardView.swift)', 24),
    msg('demo-chat-110', 'demo-proj-001', 'USER', 'PM 김지훈', 'TEXT', '좋아요! PR 리뷰하고 내일 오전까지 머지하겠습니다.', 15),
  ],
  'demo-proj-002': [
    msg('demo-chat-201', 'demo-proj-002', 'USER', 'PM 박서준', 'TEXT', 'E2E 암호화 모듈 설계 검토 부탁드립니다.', 180),
    msg('demo-chat-202', 'demo-proj-002', 'USER', '최민서', 'TEXT', 'AES-256-GCM + RSA-OAEP 조합으로 가려고 합니다. 키 교환은 X3DH 프로토콜 기반이요.', 150),
    msg('demo-chat-203', 'demo-proj-002', 'USER', 'PM 박서준', 'COMMAND', '/task @ARCHITECTURE code_review REQ-203', 130),
    msg('demo-chat-204', 'demo-proj-002', 'SYSTEM', 'System', 'STATUS', '태스크 디스패치 완료 → @ARCHITECTURE · code_review · REQ-203', 129),
    msg('demo-chat-205', 'demo-proj-002', 'AGENT', 'ARCHITECTURE 에이전트', 'AGENT_UPDATE', '암호화 설계 리뷰 중... 키 관리 전략 분석 (30%)', 100),
    msg('demo-chat-206', 'demo-proj-002', 'AGENT', 'ARCHITECTURE 에이전트', 'AGENT_UPDATE', '리뷰 완료. 키 로테이션 정책 추가 권장. (100%)', 60),
    msg('demo-chat-207', 'demo-proj-002', 'USER', '최민서', 'TEXT', '키 로테이션 90일 주기로 설정하겠습니다. 감사합니다!', 45),
    msg('demo-chat-208', 'demo-proj-002', 'USER', 'PM 박서준', 'TEXT', 'Windows 트레이 앱은 다음 스프린트로 미룹시다. 암호화가 우선.', 20),
  ],
  'demo-proj-003': [
    msg('demo-chat-301', 'demo-proj-003', 'USER', 'PM 정하윤', 'TEXT', 'HIPAA 컴플라이언스 감사 일정이 다음 주로 잡혔습니다. 감사 로그 모듈 우선 진행해야 합니다.', 300),
    msg('demo-chat-302', 'demo-proj-003', 'USER', '강도현', 'TEXT', '환자 대시보드 iOS 버전은 80% 완료, Android는 아직 시작 전입니다.', 240),
    msg('demo-chat-303', 'demo-proj-003', 'SYSTEM', 'System', 'STATUS', '프로젝트 상태가 ON_HOLD로 변경되었습니다. 사유: HIPAA 감사 준비.', 200),
    msg('demo-chat-304', 'demo-proj-003', 'USER', 'PM 정하윤', 'TEXT', '감사 준비 완료될 때까지 기능 개발은 일시 중단합니다.', 195),
  ],
  'demo-proj-004': [
    msg('demo-chat-401', 'demo-proj-004', 'USER', 'PM 윤서영', 'TEXT', '모든 기능 개발 완료! 최종 QA 통과했습니다. 🎉', 2 * 86400000 / 60000),
    msg('demo-chat-402', 'demo-proj-004', 'SYSTEM', 'System', 'STATUS', '릴리스 v1.0.0 배포 완료. 상태: DEPLOYED', 2 * 86400000 / 60000 - 60),
    msg('demo-chat-403', 'demo-proj-004', 'USER', 'PM 윤서영', 'TEXT', '고객사 FinCore에 인수 완료 이메일 발송했습니다. 프로젝트 클로즈합니다.', 2 * 86400000 / 60000 - 120),
  ],
}

export function getDemoChat(projectId: string) {
  return chatData[projectId] ?? []
}
