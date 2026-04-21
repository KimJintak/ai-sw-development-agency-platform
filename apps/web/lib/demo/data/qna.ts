const now = Date.now()
const hours = (n: number) => new Date(now - n * 3600000).toISOString()
const days = (n: number) => new Date(now - n * 86400000).toISOString()

interface DemoQna {
  id: string
  projectId: string
  question: string
  answer: string | null
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'PARKED'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  askedBy: string | null
  askedByName: string | null
  answeredBy: string | null
  answeredByName: string | null
  answeredAt: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

const all: DemoQna[] = [
  {
    id: 'demo-qna-001',
    projectId: 'demo-proj-001',
    question: 'iCloud 동기화 충돌 발생 시 어느 쪽이 우선되나요?',
    answer: 'Last-writer-wins 정책입니다. 단, 두 클라이언트가 10초 이내 동시 수정 시 충돌 뷰를 보여줍니다. 상세: /docs/conflict-resolution',
    status: 'RESOLVED',
    priority: 'P2',
    askedBy: 'client-001',
    askedByName: '김고객',
    answeredBy: 'pm-001',
    answeredByName: 'PM 김지훈',
    answeredAt: hours(30),
    tags: ['sync', 'icloud'],
    createdAt: days(2),
    updatedAt: hours(30),
  },
  {
    id: 'demo-qna-002',
    projectId: 'demo-proj-001',
    question: 'Apple Sign-In 이번 스프린트에 들어가나요?',
    answer: '아니요. REQ-004로 분리되어 다음 스프린트에 진행됩니다. 이번은 Email 로그인만 구현됩니다.',
    status: 'ANSWERED',
    priority: 'P2',
    askedBy: 'client-001',
    askedByName: '이소라',
    answeredBy: 'pm-001',
    answeredByName: 'PM 김지훈',
    answeredAt: hours(8),
    tags: ['auth'],
    createdAt: hours(18),
    updatedAt: hours(8),
  },
  {
    id: 'demo-qna-003',
    projectId: 'demo-proj-001',
    question: '위젯 업데이트 주기가 너무 느린 것 같은데 조정 가능한가요?',
    answer: null,
    status: 'OPEN',
    priority: 'P1',
    askedBy: 'client-002',
    askedByName: '박대표',
    answeredBy: null,
    answeredByName: null,
    answeredAt: null,
    tags: ['widget', 'performance'],
    createdAt: hours(3),
    updatedAt: hours(3),
  },
  {
    id: 'demo-qna-004',
    projectId: 'demo-proj-001',
    question: 'Dark mode 디자인 시안은 어디서 확인하나요?',
    answer: null,
    status: 'OPEN',
    priority: 'P3',
    askedBy: 'client-001',
    askedByName: '이소라',
    answeredBy: null,
    answeredByName: null,
    answeredAt: null,
    tags: ['design'],
    createdAt: hours(1),
    updatedAt: hours(1),
  },
]

export function getDemoQna(projectId: string, status?: string) {
  return all
    .filter((q) => q.projectId === projectId)
    .filter((q) => !status || q.status === status)
}
