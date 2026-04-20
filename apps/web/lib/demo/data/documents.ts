const now = Date.now()

interface DemoDoc {
  id: string
  projectId: string
  title: string
  category: 'CLIENT' | 'INTERNAL'
  kind: 'SPEC' | 'CONTRACT' | 'REFERENCE' | 'API_DOC' | 'MANUAL' | 'DEPLOY_GUIDE' | 'OTHER'
  body: string
  createdBy: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
  _count: { attachments: number }
  attachments?: {
    id: string
    filename: string
    mimeType: string
    sizeBytes: number
    createdAt: string
  }[]
}

const allDocuments: DemoDoc[] = [
  {
    id: 'demo-doc-001',
    projectId: 'demo-proj-001',
    title: '프로젝트 SOW (Statement of Work)',
    category: 'CONTRACT' as unknown as 'CLIENT',
    kind: 'CONTRACT',
    body: `# SwiftBoard 프로젝트 계약서

## 프로젝트 개요
- **계약명**: SwiftBoard macOS 태스크 매니저 개발
- **발주처**: NextLab Inc.
- **계약일**: 2026-03-15
- **납기일**: 2026-07-30
- **총 계약금액**: ₩180,000,000 (VAT 별도)

## 범위
1. macOS 네이티브 앱 (SwiftUI)
2. iOS 동기화 지원
3. iCloud 연동
4. 위젯 (Today Widget)

## 지불 조건
- 착수금 30% (2026-03-15)
- 중도금 40% (2026-05-30, 베타 납품)
- 잔금 30% (2026-07-30, 최종 납품)

## 하자보수
- 납품 후 3개월간 무상 버그 수정
- Critical 이슈는 24시간 내 대응
`,
    createdBy: 'Kim Jintak',
    createdById: 'demo-user-admin',
    createdAt: new Date(now - 30 * 86400000).toISOString(),
    updatedAt: new Date(now - 28 * 86400000).toISOString(),
    _count: { attachments: 2 },
    attachments: [
      { id: 'demo-att-001', filename: 'SOW-signed-scan.pdf', mimeType: 'application/pdf', sizeBytes: 1_234_567, createdAt: new Date(now - 30 * 86400000).toISOString() },
      { id: 'demo-att-002', filename: '계약서-원본.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 345_678, createdAt: new Date(now - 30 * 86400000).toISOString() },
    ],
  },
  {
    id: 'demo-doc-002',
    projectId: 'demo-proj-001',
    title: '기능 상세 명세서 v2.1',
    category: 'CLIENT',
    kind: 'SPEC',
    body: `# SwiftBoard 기능 명세서 (v2.1)

## 1. 태스크 관리
### 1.1 칸반 보드
- 컬럼: Backlog / Today / In Progress / Done
- 드래그 앤 드롭으로 상태 변경
- 컬럼별 WIP 제한 설정 (선택)

### 1.2 태스크 속성
- 제목, 설명, 우선순위 (P0~P3)
- 태그, 담당자, 마감일
- 첨부 파일 (최대 5개)
- 하위 태스크 (무한 depth)

## 2. iCloud 동기화
- CloudKit 기반
- 충돌 해결: last-writer-wins + 이력 보존
- 오프라인 지원

## 3. 위젯
- Today Widget (중/대)
- 오늘의 태스크 최대 5개 표시
`,
    createdBy: 'Kim Jintak',
    createdById: 'demo-user-admin',
    createdAt: new Date(now - 25 * 86400000).toISOString(),
    updatedAt: new Date(now - 2 * 86400000).toISOString(),
    _count: { attachments: 1 },
    attachments: [
      { id: 'demo-att-003', filename: 'wireframe-mockup.fig', mimeType: 'application/octet-stream', sizeBytes: 2_345_678, createdAt: new Date(now - 10 * 86400000).toISOString() },
    ],
  },
  {
    id: 'demo-doc-003',
    projectId: 'demo-proj-001',
    title: 'REST API 스펙 (OpenAPI 3.1)',
    category: 'INTERNAL',
    kind: 'API_DOC',
    body: `# SwiftBoard Sync API

## Base URL
\`https://api.swiftboard.example.com/v1\`

## 인증
Bearer JWT (30분 TTL, refresh token 7일)

## 엔드포인트

### GET /tasks
유저의 태스크 목록.

**Query**
- \`board\` (string, optional) - 보드 ID
- \`since\` (ISO8601, optional) - 이후 업데이트된 것만

**Response 200**
\`\`\`json
{
  "tasks": [...]
}
\`\`\`

### POST /tasks
새 태스크 생성.

### PATCH /tasks/:id
태스크 수정 (부분 업데이트).
`,
    createdBy: 'PM Agent',
    createdById: null,
    createdAt: new Date(now - 20 * 86400000).toISOString(),
    updatedAt: new Date(now - 5 * 86400000).toISOString(),
    _count: { attachments: 0 },
    attachments: [],
  },
  {
    id: 'demo-doc-004',
    projectId: 'demo-proj-001',
    title: '배포 매뉴얼 — TestFlight 업로드',
    category: 'INTERNAL',
    kind: 'DEPLOY_GUIDE',
    body: `# TestFlight 배포 가이드

## 사전 준비
1. Apple Developer 계정
2. App Store Connect 접근 권한
3. Xcode 15.x+ 설치

## 배포 절차

### 1. 아카이빙
\`\`\`bash
xcodebuild archive \\
  -workspace SwiftBoard.xcworkspace \\
  -scheme SwiftBoard \\
  -archivePath build/SwiftBoard.xcarchive
\`\`\`

### 2. IPA 추출
\`\`\`bash
xcodebuild -exportArchive \\
  -archivePath build/SwiftBoard.xcarchive \\
  -exportPath build/ipa \\
  -exportOptionsPlist ExportOptions.plist
\`\`\`

### 3. App Store Connect 업로드
\`\`\`bash
xcrun altool --upload-app \\
  -t ios \\
  -f build/ipa/SwiftBoard.ipa \\
  -u \$APPLE_ID \\
  -p "@env:ALTOOL_PASSWORD"
\`\`\`

### 4. TestFlight 등록
- App Store Connect → TestFlight → 내부 테스터에 배포
- 처리 완료까지 약 15분 소요
`,
    createdBy: 'Deploy Agent',
    createdById: null,
    createdAt: new Date(now - 14 * 86400000).toISOString(),
    updatedAt: new Date(now - 1 * 86400000).toISOString(),
    _count: { attachments: 0 },
    attachments: [],
  },
  {
    id: 'demo-doc-005',
    projectId: 'demo-proj-002',
    title: 'CloudSync E2E 암호화 설계',
    category: 'INTERNAL',
    kind: 'REFERENCE',
    body: `# CloudSync End-to-End 암호화

## 키 관리
- 각 유저당 master key (Argon2id로 비밀번호에서 파생)
- 파일별 AES-256-GCM 세션 키
- 세션 키는 master key로 래핑하여 메타데이터에 저장

## 업로드 플로우
1. 파일을 블록(4MB) 단위로 분할
2. 각 블록을 세션 키로 암호화
3. 암호화된 블록과 래핑된 세션 키 + 메타 업로드

## 공유
- 공유 받는 쪽의 public key로 세션 키를 재래핑
- 서버는 래핑된 세션 키만 중계 (평문 접근 불가)
`,
    createdBy: 'Architecture Agent',
    createdById: null,
    createdAt: new Date(now - 12 * 86400000).toISOString(),
    updatedAt: new Date(now - 3 * 86400000).toISOString(),
    _count: { attachments: 0 },
    attachments: [],
  },
  {
    id: 'demo-doc-006',
    projectId: 'demo-proj-002',
    title: '클라이언트 인수 체크리스트',
    category: 'CLIENT',
    kind: 'MANUAL',
    body: `# 인수 체크리스트

## 기능 검증
- [ ] 파일 업로드/다운로드
- [ ] 팀 폴더 공유
- [ ] 오프라인 동기화
- [ ] 충돌 해결 UI
- [ ] 검색 성능 (10만 파일 기준 < 500ms)

## 보안
- [ ] E2E 암호화 동작 확인
- [ ] 감사 로그 기록
- [ ] 2FA 설정 가능
- [ ] 세션 타임아웃 (2시간)

## 운영
- [ ] 모니터링 대시보드 접근
- [ ] 백업 정책 문서
- [ ] 장애 에스컬레이션 연락처
`,
    createdBy: 'PM',
    createdById: 'demo-user-pm',
    createdAt: new Date(now - 7 * 86400000).toISOString(),
    updatedAt: new Date(now - 12 * 3600000).toISOString(),
    _count: { attachments: 0 },
    attachments: [],
  },
]

export function getDemoDocuments(projectId: string, category?: string) {
  return allDocuments
    .filter((d) => d.projectId === projectId)
    .filter((d) => !category || d.category === category)
}

export function getDemoDocument(id: string) {
  return allDocuments.find((d) => d.id === id)
}
