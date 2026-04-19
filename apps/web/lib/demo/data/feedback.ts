const now = Date.now()

function fb(id: string, projectId: string, title: string, type: string, severity: string, status: string, source: string, body: string, daysAgo: number) {
  return {
    id, projectId, title, type, severity, status, source, body,
    createdAt: new Date(now - daysAgo * 86400000).toISOString(),
    updatedAt: new Date(now - (daysAgo - 0.5) * 86400000).toISOString(),
    autoClassified: true,
    workItemId: null,
    similarFeedback: [],
  }
}

const data: Record<string, ReturnType<typeof fb>[]> = {
  'demo-proj-001': [
    fb('demo-fb-101', 'demo-proj-001', '다크모드에서 텍스트 안 보임', 'BUG', 'P1', 'TRIAGED', 'PORTAL', '다크모드 전환 시 태스크 카드의 제목 텍스트가 배경색과 같아져서 안 보입니다.', 2),
    fb('demo-fb-102', 'demo-proj-001', '태스크 마감일 기능 요청', 'FEATURE', 'P2', 'NEW', 'PORTAL', '각 태스크에 마감일을 설정하고 알림을 받을 수 있으면 좋겠습니다.', 5),
    fb('demo-fb-103', 'demo-proj-001', '키보드 단축키 지원', 'IMPROVEMENT', 'P3', 'IN_PROGRESS', 'API', '태스크 이동에 키보드 단축키를 추가해주세요. (Cmd+→ 로 다음 컬럼 이동 등)', 8),
    fb('demo-fb-104', 'demo-proj-001', '앱 시작 시 크래시', 'BUG', 'P0', 'RESOLVED', 'SENTRY', 'macOS 14.2에서 앱 시작 시 EXC_BAD_ACCESS 크래시. 스택: AppDelegate.swift:23', 12),
  ],
  'demo-proj-002': [
    fb('demo-fb-201', 'demo-proj-002', '동기화 속도 느림', 'BUG', 'P1', 'IN_PROGRESS', 'PORTAL', '100개 이상 파일 동기화 시 속도가 매우 느려집니다. 10분 이상 소요.', 3),
    fb('demo-fb-202', 'demo-proj-002', '선택적 동기화 기능', 'FEATURE', 'P2', 'NEW', 'PORTAL', '특정 폴더만 선택해서 동기화할 수 있는 기능이 필요합니다.', 7),
    fb('demo-fb-203', 'demo-proj-002', '파일 버전 히스토리', 'FEATURE', 'P3', 'TRIAGED', 'PORTAL', '파일의 이전 버전을 확인하고 복원할 수 있으면 좋겠습니다.', 10),
  ],
  'demo-proj-003': [
    fb('demo-fb-301', 'demo-proj-003', '예약 시간 중복 허용 버그', 'BUG', 'P1', 'TRIAGED', 'API', '같은 의사에 대해 동일 시간대 예약이 중복으로 생성됩니다.', 4),
    fb('demo-fb-302', 'demo-proj-003', '환자 데이터 내보내기', 'FEATURE', 'P2', 'NEW', 'PORTAL', '자신의 건강 데이터를 CSV/PDF로 내보낼 수 있으면 좋겠습니다.', 15),
  ],
  'demo-proj-004': [
    fb('demo-fb-401', 'demo-proj-004', '차트 반응 속도 개선', 'IMPROVEMENT', 'P3', 'RESOLVED', 'PORTAL', '실시간 차트가 데이터 포인트가 많을 때 버벅거립니다.', 20),
  ],
}

export function getDemoFeedback(projectId: string) {
  return data[projectId] ?? []
}
