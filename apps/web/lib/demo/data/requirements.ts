const now = Date.now()

function req(id: string, projectId: string, title: string, status: string, platforms: string[], featureFile: string, version: number) {
  return {
    id,
    projectId,
    title,
    status,
    platforms,
    featureFile,
    version,
    updatedAt: new Date(now - Math.random() * 10 * 86400000).toISOString(),
    _count: { versions: version, requirementLinks: Math.floor(Math.random() * 3) + 1 },
  }
}

const data: Record<string, ReturnType<typeof req>[]> = {
  'demo-proj-001': [
    req('demo-req-101', 'demo-proj-001', '사용자 로그인', 'APPROVED', ['MACOS', 'IOS'],
      `@macos @ios\nFeature: 사용자 로그인\n  Scenario: 이메일 로그인\n    Given 가입된 이메일이 있을 때\n    When 올바른 비밀번호를 입력하면\n    Then 메인 대시보드로 이동한다\n\n  Scenario: Apple ID 로그인\n    Given Apple ID가 연결되어 있을 때\n    When "Apple로 로그인" 버튼을 누르면\n    Then 인증 후 대시보드로 이동한다`, 3),
    req('demo-req-102', 'demo-proj-001', '칸반 보드 드래그앤드롭', 'PENDING_APPROVAL', ['MACOS'],
      `@macos\nFeature: 칸반 보드\n  Scenario: 태스크 이동\n    Given 칸반 보드에 태스크가 있을 때\n    When 태스크를 다른 컬럼으로 드래그하면\n    Then 상태가 자동으로 변경된다\n\n  Scenario: 새 태스크 생성\n    Given 칸반 보드가 표시될 때\n    When "+" 버튼을 클릭하면\n    Then 새 태스크 입력 폼이 나타난다`, 2),
    req('demo-req-103', 'demo-proj-001', 'iCloud 동기화', 'DRAFT', ['IOS'],
      `@ios\nFeature: iCloud 동기화\n  Scenario: 자동 동기화\n    Given 사용자가 iCloud에 로그인되어 있을 때\n    When 태스크를 추가하면\n    Then 다른 기기에서도 즉시 반영된다`, 1),
  ],
  'demo-proj-002': [
    req('demo-req-201', 'demo-proj-002', '파일 업로드', 'APPROVED', ['MACOS', 'WINDOWS', 'WEB'],
      `@web @macos @windows\nFeature: 파일 업로드\n  Scenario: 대용량 파일 청크 업로드\n    Given 100MB 이상의 파일을 선택했을 때\n    When 업로드 버튼을 클릭하면\n    Then 파일이 청크 단위로 업로드되고 진행률이 표시된다`, 2),
    req('demo-req-202', 'demo-proj-002', '충돌 해결', 'APPROVED', ['WEB'],
      `@web\nFeature: 파일 충돌 해결\n  Scenario: 동시 편집 충돌\n    Given 두 사용자가 같은 파일을 편집했을 때\n    When 동기화가 실행되면\n    Then 충돌 해결 UI가 표시된다`, 1),
    req('demo-req-203', 'demo-proj-002', 'E2E 암호화', 'PENDING_APPROVAL', ['MACOS', 'WINDOWS', 'WEB'],
      `@web @macos @windows\nFeature: E2E 암호화\n  Scenario: 파일 암호화\n    Given 사용자가 파일을 업로드할 때\n    When 업로드가 시작되면\n    Then 클라이언트에서 AES-256으로 암호화 후 전송된다`, 1),
  ],
  'demo-proj-003': [
    req('demo-req-301', 'demo-proj-003', '환자 프로필', 'APPROVED', ['IOS', 'ANDROID', 'WEB'],
      `@ios @android @web\nFeature: 환자 프로필\n  Scenario: 프로필 조회\n    Given 로그인한 환자일 때\n    When 프로필 탭을 선택하면\n    Then 건강 데이터 요약과 예약 내역이 표시된다`, 2),
    req('demo-req-302', 'demo-proj-003', '상담 예약', 'DRAFT', ['IOS', 'ANDROID'],
      `@ios @android\nFeature: 상담 예약\n  Scenario: 새 예약 생성\n    Given 의사 목록이 표시될 때\n    When 원하는 시간대를 선택하면\n    Then 예약 확인 알림이 전송된다`, 1),
    req('demo-req-303', 'demo-proj-003', '건강 데이터 시각화', 'PENDING_APPROVAL', ['IOS', 'WEB'],
      `@ios @web\nFeature: 건강 데이터 차트\n  Scenario: 월간 추이 그래프\n    Given 30일 이상의 데이터가 있을 때\n    When 차트 뷰를 선택하면\n    Then 혈압/체중/운동 추이 그래프가 표시된다`, 1),
  ],
  'demo-proj-004': [
    req('demo-req-401', 'demo-proj-004', '실시간 주가 차트', 'APPROVED', ['WEB'],
      `@web\nFeature: 실시간 차트\n  Scenario: 주가 실시간 업데이트\n    Given 포트폴리오 대시보드가 표시될 때\n    When 시장이 열려있으면\n    Then 주가가 1초 간격으로 업데이트된다`, 3),
    req('demo-req-402', 'demo-proj-004', 'PDF 리포트', 'APPROVED', ['WEB'],
      `@web\nFeature: PDF 리포트\n  Scenario: 월간 리포트 생성\n    Given 포트폴리오 데이터가 있을 때\n    When "리포트 다운로드" 버튼을 클릭하면\n    Then PDF 파일이 생성되어 다운로드된다`, 2),
  ],
}

export function getDemoRequirements(projectId: string) {
  return data[projectId] ?? []
}
