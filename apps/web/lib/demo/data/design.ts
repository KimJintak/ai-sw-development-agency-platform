const now = Date.now()

function artifact(id: string, projectId: string, title: string, type: string, mermaidCode: string, figmaUrl?: string) {
  return {
    id,
    projectId,
    title,
    type,
    mermaidCode: mermaidCode || null,
    figmaUrl: figmaUrl ?? null,
    version: 1,
    createdAt: new Date(now - Math.random() * 15 * 86400000).toISOString(),
    updatedAt: new Date(now - Math.random() * 5 * 86400000).toISOString(),
    versions: [{ id: `${id}-v1`, version: 1, mermaidCode, createdAt: new Date(now - 10 * 86400000).toISOString() }],
  }
}

const data: Record<string, ReturnType<typeof artifact>[]> = {
  'demo-proj-001': [
    artifact('demo-design-101', 'demo-proj-001', 'SwiftBoard 아키텍처', 'ARCHITECTURE',
      `flowchart LR
  U[SwiftUI App] -->|REST| G[API Gateway]
  G --> A[Auth Service]
  G --> T[Task Service]
  G --> S[Sync Service]
  T --> D[(TaskDB)]
  S --> IC[(iCloud)]
  A --> R[(Redis)]`),
    artifact('demo-design-102', 'demo-proj-001', 'SwiftBoard ERD', 'ERD',
      `erDiagram
  USER ||--o{ BOARD : owns
  BOARD ||--o{ COLUMN : contains
  COLUMN ||--o{ TASK : contains
  TASK ||--o{ TAG : has
  TASK ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes`),
    artifact('demo-design-103', 'demo-proj-001', '로그인 플로우', 'FLOWCHART',
      `flowchart TD
  A[앱 시작] --> B{토큰 존재?}
  B -->|Yes| C[토큰 검증]
  B -->|No| D[로그인 화면]
  C -->|Valid| E[대시보드]
  C -->|Expired| F[토큰 갱신]
  F -->|Success| E
  F -->|Fail| D
  D --> G{로그인 방식}
  G -->|Email| H[이메일 인증]
  G -->|Apple| I[Apple ID 인증]
  H --> E
  I --> E`),
  ],
  'demo-proj-002': [
    artifact('demo-design-201', 'demo-proj-002', 'CloudSync 시스템 아키텍처', 'ARCHITECTURE',
      `flowchart LR
  C1[macOS Client] --> LB[Load Balancer]
  C2[Windows Client] --> LB
  C3[Web App] --> LB
  LB --> API[API Server]
  API --> Q[Task Queue]
  Q --> W[Sync Worker]
  W --> S3[(S3 Storage)]
  API --> DB[(PostgreSQL)]
  API --> R[(Redis Cache)]`),
    artifact('demo-design-202', 'demo-proj-002', '파일 동기화 시퀀스', 'SEQUENCE',
      `sequenceDiagram
  participant C as Client
  participant A as API Server
  participant Q as Queue
  participant W as Worker
  participant S as S3

  C->>A: 파일 변경 감지
  A->>A: 충돌 검사
  A->>Q: 동기화 태스크 등록
  Q->>W: 태스크 처리
  W->>S: 청크 업로드
  S-->>W: 업로드 완료
  W-->>A: 동기화 완료
  A-->>C: 상태 업데이트`),
    artifact('demo-design-203', 'demo-proj-002', 'CloudSync ERD', 'ERD',
      `erDiagram
  USER ||--o{ WORKSPACE : belongs_to
  WORKSPACE ||--o{ FOLDER : contains
  FOLDER ||--o{ FILE : contains
  FILE ||--o{ FILE_VERSION : has
  FILE_VERSION ||--|| CHUNK : stored_as
  USER ||--o{ SHARE_LINK : creates`),
  ],
  'demo-proj-003': [
    artifact('demo-design-301', 'demo-proj-003', 'MediTrack 아키텍처', 'ARCHITECTURE',
      `flowchart LR
  M[Mobile App] -->|HTTPS| GW[API Gateway]
  W[Web Portal] -->|HTTPS| GW
  GW --> AU[Auth Service]
  GW --> PT[Patient Service]
  GW --> AP[Appointment Service]
  GW --> NT[Notification Service]
  PT --> DB[(PostgreSQL)]
  AP --> DB
  NT --> FCM[Firebase FCM]`),
  ],
  'demo-proj-004': [
    artifact('demo-design-401', 'demo-proj-004', 'FinLedger 아키텍처', 'ARCHITECTURE',
      `flowchart LR
  B[Browser] --> N[Next.js]
  N --> API[REST API]
  API --> DB[(PostgreSQL)]
  API --> WS[WebSocket Server]
  WS --> MQ[Market Data Feed]
  API --> PDF[PDF Generator]`),
  ],
}

export function getDemoDesignArtifacts(projectId: string, type?: string) {
  const items = data[projectId] ?? []
  if (type) return items.filter((d) => d.type === type)
  return items
}

export function getDemoDesignArtifact(id: string) {
  for (const items of Object.values(data)) {
    const found = items.find((d) => d.id === id)
    if (found) return found
  }
  return null
}
