const now = Date.now()

export const demoProjects = [
  {
    id: 'demo-proj-001',
    name: 'SwiftBoard - macOS 태스크 매니저',
    description: 'macOS 네이티브 태스크 관리 앱. SwiftUI 기반 칸반 보드, iCloud 동기화, 위젯 지원.',
    status: 'ACTIVE',
    platforms: ['MACOS', 'IOS'],
    githubRepo: 'nextlab/swiftboard',
    customerId: 'demo-cust-001',
    progress: 72,
    createdAt: new Date(now - 30 * 86400000).toISOString(),
    updatedAt: new Date(now - 3600000).toISOString(),
  },
  {
    id: 'demo-proj-002',
    name: 'CloudSync - 크로스플랫폼 파일동기화',
    description: 'Dropbox 대안 엔터프라이즈 파일 동기화 솔루션. E2E 암호화, 팀 공유 폴더.',
    status: 'ACTIVE',
    platforms: ['MACOS', 'WINDOWS', 'WEB'],
    githubRepo: 'cloudpick/cloudsync',
    customerId: 'demo-cust-002',
    progress: 45,
    createdAt: new Date(now - 20 * 86400000).toISOString(),
    updatedAt: new Date(now - 7200000).toISOString(),
  },
  {
    id: 'demo-proj-003',
    name: 'MediTrack - 헬스케어 앱',
    description: '환자 건강 데이터 추적 및 의사-환자 커뮤니케이션 앱. HIPAA 준수.',
    status: 'ON_HOLD',
    platforms: ['IOS', 'ANDROID', 'WEB'],
    githubRepo: 'medisoft/meditrack',
    customerId: 'demo-cust-003',
    progress: 30,
    createdAt: new Date(now - 45 * 86400000).toISOString(),
    updatedAt: new Date(now - 5 * 86400000).toISOString(),
  },
  {
    id: 'demo-proj-004',
    name: 'FinLedger - 금융 대시보드',
    description: '실시간 주식/암호화폐 포트폴리오 대시보드. 차트, 알림, PDF 리포트.',
    status: 'COMPLETED',
    platforms: ['WEB'],
    githubRepo: 'fincore/finledger',
    customerId: 'demo-cust-004',
    progress: 100,
    createdAt: new Date(now - 90 * 86400000).toISOString(),
    updatedAt: new Date(now - 2 * 86400000).toISOString(),
  },
]

export function getDemoProject(id: string) {
  return demoProjects.find((p) => p.id === id) ?? null
}

export function getDemoProjectProgress(id: string) {
  const p = getDemoProject(id)
  if (!p) return { completionPercent: 0 }
  return { completionPercent: p.progress }
}
