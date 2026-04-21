const now = Date.now()
const days = (n: number) => new Date(now - n * 86400000).toISOString()

interface DemoCredential {
  id: string
  projectId: string
  role: string
  label: string
  email: string
  loginUrl: string | null
  note: string | null
  lastRotatedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  _demoPassword: string
}

const all: DemoCredential[] = [
  {
    id: 'demo-cred-001',
    projectId: 'demo-proj-001',
    role: 'Super Admin',
    label: '슈퍼 관리자',
    email: 'superadmin@swiftboard.dev',
    loginUrl: 'https://swiftboard-staging.example.com/login',
    note: '모든 권한. 데이터 초기화 주의.',
    lastRotatedAt: days(3),
    createdBy: 'demo-user-admin',
    createdAt: days(20),
    updatedAt: days(3),
    _demoPassword: 'DemoPwd#SA2026',
  },
  {
    id: 'demo-cred-002',
    projectId: 'demo-proj-001',
    role: 'Brand Owner',
    label: '고객사 관리자',
    email: 'brand@swiftboard.dev',
    loginUrl: 'https://swiftboard-staging.example.com/login',
    note: '팀/멤버/빌링 관리',
    lastRotatedAt: days(7),
    createdBy: 'demo-user-admin',
    createdAt: days(15),
    updatedAt: days(7),
    _demoPassword: 'DemoPwd#BO2026',
  },
  {
    id: 'demo-cred-003',
    projectId: 'demo-proj-001',
    role: 'End User',
    label: '일반 사용자',
    email: 'enduser@swiftboard.dev',
    loginUrl: 'https://swiftboard-staging.example.com/login',
    note: '자신의 보드만 접근',
    lastRotatedAt: null,
    createdBy: 'demo-user-pm',
    createdAt: days(10),
    updatedAt: days(10),
    _demoPassword: 'DemoPwd#EU2026',
  },
  {
    id: 'demo-cred-004',
    projectId: 'demo-proj-002',
    role: 'Admin',
    label: 'CloudSync 관리자',
    email: 'admin@cloudsync.dev',
    loginUrl: 'https://cloudsync-staging.example.com/signin',
    note: '테넌트 관리',
    lastRotatedAt: days(1),
    createdBy: 'demo-user-admin',
    createdAt: days(12),
    updatedAt: days(1),
    _demoPassword: 'CS@2026admin',
  },
  {
    id: 'demo-cred-005',
    projectId: 'demo-proj-002',
    role: 'Team Member',
    label: '팀 멤버',
    email: 'member@cloudsync.dev',
    loginUrl: 'https://cloudsync-staging.example.com/signin',
    note: null,
    lastRotatedAt: null,
    createdBy: 'demo-user-admin',
    createdAt: days(6),
    updatedAt: days(6),
    _demoPassword: 'CS@2026team',
  },
]

function toPublic(c: DemoCredential) {
  const { _demoPassword: _, ...pub } = c
  return pub
}

export function getDemoCredentials(projectId: string) {
  return all.filter((c) => c.projectId === projectId).map(toPublic)
}

export function getDemoCredentialPassword(id: string): { id: string; password: string } | null {
  const found = all.find((c) => c.id === id)
  return found ? { id: found.id, password: found._demoPassword } : null
}
