const now = Date.now()
const days = (n: number) => new Date(now - n * 86400000).toISOString()

interface DemoLink {
  id: string
  projectId: string
  category: 'FIGMA' | 'PROTOTYPE' | 'WBS' | 'SRS' | 'STAGING' | 'PRODUCTION' | 'DOCS' | 'REPO' | 'QA_SHEET' | 'OTHER'
  label: string
  url: string
  description: string | null
  sortOrder: number
  createdAt: string
}

const allLinks: DemoLink[] = [
  // demo-proj-001 — SwiftBoard (풍부한 링크 세트 — Woojoo CRM 스타일)
  {
    id: 'demo-link-001',
    projectId: 'demo-proj-001',
    category: 'WBS',
    label: 'WBS — Phase 1',
    url: 'https://docs.google.com/spreadsheets/d/demo-wbs',
    description: 'Google Sheets 작업 분해도',
    sortOrder: 0,
    createdAt: days(20),
  },
  {
    id: 'demo-link-002',
    projectId: 'demo-proj-001',
    category: 'PROTOTYPE',
    label: 'SwiftBoard Prototype',
    url: 'https://swiftboard-prototype.figma.site',
    description: '클릭 가능한 데모 사이트',
    sortOrder: 0,
    createdAt: days(18),
  },
  {
    id: 'demo-link-003',
    projectId: 'demo-proj-001',
    category: 'SRS',
    label: '기획서 (SRS v2.1)',
    url: 'https://docs.google.com/presentation/d/demo-srs',
    description: 'Google Slides',
    sortOrder: 0,
    createdAt: days(15),
  },
  {
    id: 'demo-link-004',
    projectId: 'demo-proj-001',
    category: 'FIGMA',
    label: 'Figma Design System',
    url: 'https://www.figma.com/design/demo-file/SwiftBoard',
    description: '컴포넌트 라이브러리 + 화면',
    sortOrder: 0,
    createdAt: days(14),
  },
  {
    id: 'demo-link-005',
    projectId: 'demo-proj-001',
    category: 'STAGING',
    label: 'Staging 환경',
    url: 'https://swiftboard-staging.example.com',
    description: '매일 02:00 자동 배포',
    sortOrder: 0,
    createdAt: days(7),
  },
  {
    id: 'demo-link-006',
    projectId: 'demo-proj-001',
    category: 'REPO',
    label: 'GitHub Repo',
    url: 'https://github.com/nextlab/swiftboard',
    description: null,
    sortOrder: 0,
    createdAt: days(30),
  },
  {
    id: 'demo-link-007',
    projectId: 'demo-proj-001',
    category: 'QA_SHEET',
    label: 'Q&A / 이슈 시트',
    url: 'https://docs.google.com/spreadsheets/d/demo-qna',
    description: '고객사-우리팀 커뮤니케이션 로그',
    sortOrder: 0,
    createdAt: days(5),
  },
  // demo-proj-002 — CloudSync
  {
    id: 'demo-link-010',
    projectId: 'demo-proj-002',
    category: 'FIGMA',
    label: 'CloudSync UI Kit',
    url: 'https://www.figma.com/design/demo-cloudsync',
    description: null,
    sortOrder: 0,
    createdAt: days(10),
  },
  {
    id: 'demo-link-011',
    projectId: 'demo-proj-002',
    category: 'WBS',
    label: 'WBS V2',
    url: 'https://docs.google.com/spreadsheets/d/demo-cs-wbs',
    description: null,
    sortOrder: 0,
    createdAt: days(8),
  },
  {
    id: 'demo-link-012',
    projectId: 'demo-proj-002',
    category: 'STAGING',
    label: 'Staging',
    url: 'https://cloudsync-staging.example.com',
    description: null,
    sortOrder: 0,
    createdAt: days(3),
  },
]

export function getDemoLinks(projectId: string): DemoLink[] {
  return allLinks.filter((l) => l.projectId === projectId)
}
