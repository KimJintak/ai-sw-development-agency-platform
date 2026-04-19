const now = Date.now()

const testCases: Record<string, Array<{
  id: string; workItemId: string; title: string; scenario: string;
  platform: string; status: string; createdAt: string
}>> = {
  'demo-wi-103': [
    { id: 'demo-tc-001', workItemId: 'demo-wi-103', title: 'Apple ID 로그인 성공', scenario: 'Given Apple ID 연결됨 When 로그인 버튼 클릭 Then 대시보드 이동', platform: 'IOS', status: 'PASSED', createdAt: new Date(now - 5 * 86400000).toISOString() },
    { id: 'demo-tc-002', workItemId: 'demo-wi-103', title: 'Apple ID 미연결 시 안내', scenario: 'Given Apple ID 미연결 When 로그인 시도 Then 연결 안내 표시', platform: 'IOS', status: 'PASSED', createdAt: new Date(now - 5 * 86400000).toISOString() },
  ],
  'demo-wi-104': [
    { id: 'demo-tc-003', workItemId: 'demo-wi-104', title: '이메일 로그인 성공', scenario: 'Given 가입된 이메일 When 올바른 비밀번호 Then 대시보드', platform: 'MACOS', status: 'PASSED', createdAt: new Date(now - 8 * 86400000).toISOString() },
    { id: 'demo-tc-004', workItemId: 'demo-wi-104', title: '잘못된 비밀번호', scenario: 'Given 가입된 이메일 When 잘못된 비밀번호 Then 오류 표시', platform: 'MACOS', status: 'PASSED', createdAt: new Date(now - 8 * 86400000).toISOString() },
    { id: 'demo-tc-005', workItemId: 'demo-wi-104', title: '미등록 이메일', scenario: 'Given 미등록 이메일 When 로그인 시도 Then 안내 메시지', platform: 'MACOS', status: 'PASSED', createdAt: new Date(now - 8 * 86400000).toISOString() },
  ],
  'demo-wi-106': [
    { id: 'demo-tc-006', workItemId: 'demo-wi-106', title: '태스크 드래그 이동', scenario: 'Given 칸반 보드 When 태스크 드래그 Then 상태 변경', platform: 'MACOS', status: 'PASSED', createdAt: new Date(now - 3 * 86400000).toISOString() },
    { id: 'demo-tc-007', workItemId: 'demo-wi-106', title: '빈 컬럼 드롭', scenario: 'Given 빈 컬럼 When 태스크 드롭 Then 첫 항목으로 추가', platform: 'MACOS', status: 'FAILED', createdAt: new Date(now - 3 * 86400000).toISOString() },
  ],
  'demo-wi-203': [
    { id: 'demo-tc-008', workItemId: 'demo-wi-203', title: '소형 파일 업로드', scenario: 'Given 10MB 파일 When 업로드 Then 단일 전송', platform: 'WEB', status: 'PASSED', createdAt: new Date(now - 6 * 86400000).toISOString() },
    { id: 'demo-tc-009', workItemId: 'demo-wi-203', title: '대용량 파일 청크', scenario: 'Given 500MB 파일 When 업로드 Then 청크 분할', platform: 'WEB', status: 'PASSED', createdAt: new Date(now - 6 * 86400000).toISOString() },
    { id: 'demo-tc-010', workItemId: 'demo-wi-203', title: '네트워크 단절 재시도', scenario: 'Given 업로드 중 When 네트워크 단절 Then 자동 재시도', platform: 'WEB', status: 'PASSED', createdAt: new Date(now - 6 * 86400000).toISOString() },
  ],
  'demo-wi-204': [
    { id: 'demo-tc-011', workItemId: 'demo-wi-204', title: '동시 편집 충돌 감지', scenario: 'Given 두 사용자 편집 When 동기화 Then 충돌 감지', platform: 'WEB', status: 'PASSED', createdAt: new Date(now - 2 * 86400000).toISOString() },
    { id: 'demo-tc-012', workItemId: 'demo-wi-204', title: '충돌 해결 UI', scenario: 'Given 충돌 발생 When UI 표시 Then 선택 가능', platform: 'WEB', status: 'FAILED', createdAt: new Date(now - 2 * 86400000).toISOString() },
  ],
}

const coverageData: Record<string, { totalWorkItems: number; workItemsWithTests: number; coveragePercent: number; totalTestCases: number }> = {
  'demo-proj-001': { totalWorkItems: 10, workItemsWithTests: 7, coveragePercent: 70, totalTestCases: 7 },
  'demo-proj-002': { totalWorkItems: 10, workItemsWithTests: 5, coveragePercent: 50, totalTestCases: 5 },
  'demo-proj-003': { totalWorkItems: 5, workItemsWithTests: 2, coveragePercent: 40, totalTestCases: 3 },
  'demo-proj-004': { totalWorkItems: 5, workItemsWithTests: 5, coveragePercent: 100, totalTestCases: 8 },
}

export function getDemoTestCases(workItemId?: string) {
  if (workItemId) return testCases[workItemId] ?? []
  return Object.values(testCases).flat()
}

export function getDemoCoverage(projectId: string) {
  return coverageData[projectId] ?? { totalWorkItems: 0, workItemsWithTests: 0, coveragePercent: 0, totalTestCases: 0 }
}
