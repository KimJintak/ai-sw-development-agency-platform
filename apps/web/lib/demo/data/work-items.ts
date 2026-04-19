const now = Date.now()

function wi(id: string, projectId: string, title: string, type: string, status: string, priority: string, platform?: string, parentId?: string) {
  return {
    id,
    projectId,
    title,
    type,
    status,
    priority,
    platform: platform ?? null,
    parentId: parentId ?? null,
    description: null,
    createdAt: new Date(now - Math.random() * 20 * 86400000).toISOString(),
    updatedAt: new Date(now - Math.random() * 86400000).toISOString(),
  }
}

const proj1Items = [
  wi('demo-wi-101', 'demo-proj-001', '사용자 인증 시스템', 'EPIC', 'IN_PROGRESS', 'P0'),
  wi('demo-wi-102', 'demo-proj-001', '칸반 보드 UI', 'EPIC', 'IN_PROGRESS', 'P0'),
  wi('demo-wi-103', 'demo-proj-001', 'Apple ID 소셜 로그인', 'STORY', 'DONE', 'P1', 'IOS', 'demo-wi-101'),
  wi('demo-wi-104', 'demo-proj-001', '이메일/비밀번호 로그인', 'STORY', 'DONE', 'P0', 'MACOS', 'demo-wi-101'),
  wi('demo-wi-105', 'demo-proj-001', '비밀번호 재설정 플로우', 'STORY', 'REVIEW', 'P1', 'MACOS', 'demo-wi-101'),
  wi('demo-wi-106', 'demo-proj-001', '드래그앤드롭 칸반', 'STORY', 'IN_PROGRESS', 'P0', 'MACOS', 'demo-wi-102'),
  wi('demo-wi-107', 'demo-proj-001', '태스크 필터링/검색', 'STORY', 'IN_PROGRESS', 'P2', 'MACOS', 'demo-wi-102'),
  wi('demo-wi-108', 'demo-proj-001', 'iCloud 동기화 구현', 'TASK', 'BACKLOG', 'P1', 'IOS'),
  wi('demo-wi-109', 'demo-proj-001', '위젯 Extension 개발', 'TASK', 'BACKLOG', 'P2', 'IOS'),
  wi('demo-wi-110', 'demo-proj-001', '다크모드 지원', 'TASK', 'REVIEW', 'P3', 'MACOS'),
]

const proj2Items = [
  wi('demo-wi-201', 'demo-proj-002', '파일 동기화 엔진', 'EPIC', 'IN_PROGRESS', 'P0'),
  wi('demo-wi-202', 'demo-proj-002', '팀 공유 폴더', 'EPIC', 'BACKLOG', 'P1'),
  wi('demo-wi-203', 'demo-proj-002', '파일 청크 업로드', 'STORY', 'DONE', 'P0', 'WEB', 'demo-wi-201'),
  wi('demo-wi-204', 'demo-proj-002', '충돌 감지 알고리즘', 'STORY', 'IN_PROGRESS', 'P0', 'WEB', 'demo-wi-201'),
  wi('demo-wi-205', 'demo-proj-002', 'E2E 암호화 적용', 'STORY', 'IN_PROGRESS', 'P0', 'WEB', 'demo-wi-201'),
  wi('demo-wi-206', 'demo-proj-002', 'Windows 트레이 앱', 'TASK', 'BACKLOG', 'P1', 'WINDOWS'),
  wi('demo-wi-207', 'demo-proj-002', 'macOS Finder 확장', 'TASK', 'REVIEW', 'P1', 'MACOS'),
  wi('demo-wi-208', 'demo-proj-002', '폴더 초대 링크', 'STORY', 'BACKLOG', 'P2', undefined, 'demo-wi-202'),
  wi('demo-wi-209', 'demo-proj-002', '권한 관리 UI', 'STORY', 'BACKLOG', 'P2', 'WEB', 'demo-wi-202'),
  wi('demo-wi-210', 'demo-proj-002', '대용량 파일 프리뷰', 'TASK', 'DONE', 'P3', 'WEB'),
]

const proj3Items = [
  wi('demo-wi-301', 'demo-proj-003', '환자 대시보드', 'EPIC', 'IN_PROGRESS', 'P0'),
  wi('demo-wi-302', 'demo-proj-003', '의사 상담 예약', 'STORY', 'DONE', 'P0', 'IOS', 'demo-wi-301'),
  wi('demo-wi-303', 'demo-proj-003', '건강 데이터 차트', 'STORY', 'IN_PROGRESS', 'P1', 'IOS', 'demo-wi-301'),
  wi('demo-wi-304', 'demo-proj-003', 'HIPAA 감사 로그', 'TASK', 'BACKLOG', 'P0', 'WEB'),
  wi('demo-wi-305', 'demo-proj-003', '푸시 알림 설정', 'TASK', 'BACKLOG', 'P2', 'ANDROID'),
]

const proj4Items = [
  wi('demo-wi-401', 'demo-proj-004', '실시간 차트 엔진', 'EPIC', 'DONE', 'P0'),
  wi('demo-wi-402', 'demo-proj-004', '포트폴리오 대시보드', 'STORY', 'DONE', 'P0', 'WEB', 'demo-wi-401'),
  wi('demo-wi-403', 'demo-proj-004', '알림 시스템', 'STORY', 'DONE', 'P1', 'WEB', 'demo-wi-401'),
  wi('demo-wi-404', 'demo-proj-004', 'PDF 리포트 생성', 'TASK', 'DONE', 'P2', 'WEB'),
  wi('demo-wi-405', 'demo-proj-004', '다크모드 차트 테마', 'TASK', 'DONE', 'P3', 'WEB'),
]

const allItems: Record<string, typeof proj1Items> = {
  'demo-proj-001': proj1Items,
  'demo-proj-002': proj2Items,
  'demo-proj-003': proj3Items,
  'demo-proj-004': proj4Items,
}

export function getDemoWorkItems(projectId: string) {
  return allItems[projectId] ?? []
}
