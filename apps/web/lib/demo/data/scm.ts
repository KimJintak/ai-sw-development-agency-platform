const now = Date.now()
const hours = (n: number) => new Date(now - n * 3600000).toISOString()
const days = (n: number) => new Date(now - n * 86400000).toISOString()

interface RepoMap {
  [projectId: string]: {
    owner: string
    repo: string
    defaultBranch: string
    private: boolean
    description: string | null
    stars: number
    issues: number
  }
}

const repos: RepoMap = {
  'demo-proj-001': {
    owner: 'nextlab',
    repo: 'swiftboard',
    defaultBranch: 'main',
    private: true,
    description: 'SwiftBoard — macOS 태스크 매니저 (SwiftUI + CloudKit)',
    stars: 12,
    issues: 7,
  },
  'demo-proj-002': {
    owner: 'cloudpick',
    repo: 'cloudsync',
    defaultBranch: 'main',
    private: true,
    description: 'E2E 암호화 파일 동기화 SaaS',
    stars: 34,
    issues: 14,
  },
  'demo-proj-003': {
    owner: 'medisoft',
    repo: 'meditrack',
    defaultBranch: 'develop',
    private: true,
    description: 'HIPAA 준수 헬스케어 앱',
    stars: 3,
    issues: 2,
  },
  'demo-proj-004': {
    owner: 'delta',
    repo: 'lms',
    defaultBranch: 'main',
    private: false,
    description: '강의 스트리밍 LMS',
    stars: 89,
    issues: 1,
  },
}

export function getDemoRepo(projectId: string) {
  const r = repos[projectId] ?? repos['demo-proj-001']
  return {
    owner: r.owner,
    repo: r.repo,
    defaultBranch: r.defaultBranch,
    private: r.private,
    htmlUrl: '#',
    description: r.description,
    pushedAt: hours(2),
    stargazersCount: r.stars,
    openIssuesCount: r.issues,
  }
}

interface BranchDef {
  name: string
  sha: string
  protected: boolean
}

const branchMap: Record<string, BranchDef[]> = {
  'demo-proj-001': [
    { name: 'main', sha: 'a7f9c32', protected: true },
    { name: 'develop', sha: 'b4e8221', protected: false },
    { name: 'feature/login-apple-signin', sha: '9c2d544', protected: false },
    { name: 'feature/icloud-sync', sha: '3f1a9e7', protected: false },
    { name: 'fix/crash-empty-password', sha: '7d4b8ab', protected: false },
  ],
  'demo-proj-002': [
    { name: 'main', sha: '2a4e6c1', protected: true },
    { name: 'develop', sha: '5b7f3d9', protected: false },
    { name: 'feature/team-folders', sha: 'e2c8f14', protected: false },
    { name: 'chore/upgrade-next-15', sha: 'aa1bc3d', protected: false },
  ],
}

export function getDemoBranches(projectId: string): BranchDef[] {
  return branchMap[projectId] ?? branchMap['demo-proj-001']
}

interface CommitDef {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

const commitMap: Record<string, CommitDef[]> = {
  'demo-proj-001': [
    { sha: 'a7f9c32', message: 'fix(login): 빈 비밀번호 입력 시 크래시 방지 (guard let)', author: 'MAC_DEV Agent', date: hours(3), url: '#' },
    { sha: 'c3a89b0', message: 'feat(board): WIP 제한 설정 UI', author: 'Kim Jintak', date: hours(12), url: '#' },
    { sha: 'e1d47f2', message: 'feat(widget): 오늘의 태스크 위젯 Medium/Large 구현', author: 'MAC_DEV Agent', date: days(1), url: '#' },
    { sha: '7b2c9aa', message: 'chore: Xcode 15.3 호환 업그레이드', author: 'Kim Jintak', date: days(2), url: '#' },
    { sha: '44e7c1d', message: 'test(board): 드래그 앤 드롭 XCTest 추가', author: 'QA Agent', date: days(3), url: '#' },
    { sha: '9a2f831', message: 'docs: README 스크린샷 업데이트', author: 'Kim Jintak', date: days(4), url: '#' },
    { sha: '1ce6b3e', message: 'feat(sync): iCloud 충돌 해결 로직', author: 'MAC_DEV Agent', date: days(5), url: '#' },
    { sha: '58d4a22', message: 'refactor: TaskViewModel 분리', author: 'Architecture Agent', date: days(6), url: '#' },
  ],
  'demo-proj-002': [
    { sha: '2a4e6c1', message: 'feat(crypto): Argon2id master key 파생', author: 'Architecture Agent', date: hours(5), url: '#' },
    { sha: '8f1a3e0', message: 'fix(upload): 4MB 블록 경계 오류', author: 'AWS_DEV Agent', date: hours(20), url: '#' },
    { sha: 'db74c56', message: 'feat(share): public key 기반 세션 키 재래핑', author: 'AWS_DEV Agent', date: days(1), url: '#' },
    { sha: '3e9b7f4', message: 'chore: @ai-sdk/anthropic 최신 업그레이드', author: 'Kim Jintak', date: days(2), url: '#' },
  ],
}

export function getDemoCommits(projectId: string, branch?: string): CommitDef[] {
  const list = commitMap[projectId] ?? commitMap['demo-proj-001']
  if (!branch || branch === getDemoRepo(projectId).defaultBranch) return list
  // Non-default branch shows 2-3 sample commits
  return list.slice(0, 3).map((c, i) => ({ ...c, sha: c.sha.slice(0, 6) + String(i), message: `[${branch}] ${c.message}` }))
}

interface PullDef {
  number: number
  title: string
  state: 'open' | 'closed'
  draft: boolean
  user: string
  head: string
  base: string
  createdAt: string
  updatedAt: string
  mergedAt: string | null
  htmlUrl: string
}

const pullMap: Record<string, PullDef[]> = {
  'demo-proj-001': [
    {
      number: 48,
      title: 'fix(login): 빈 비밀번호 입력 시 크래시 방지',
      state: 'open',
      draft: false,
      user: 'MAC_DEV Agent',
      head: 'fix/crash-empty-password',
      base: 'main',
      createdAt: hours(4),
      updatedAt: hours(1),
      mergedAt: null,
      htmlUrl: '#',
    },
    {
      number: 47,
      title: 'feat: Apple Sign-In 지원',
      state: 'open',
      draft: true,
      user: 'Kim Jintak',
      head: 'feature/login-apple-signin',
      base: 'develop',
      createdAt: hours(18),
      updatedAt: hours(6),
      mergedAt: null,
      htmlUrl: '#',
    },
    {
      number: 46,
      title: 'feat(widget): 오늘의 태스크 위젯',
      state: 'closed',
      draft: false,
      user: 'MAC_DEV Agent',
      head: 'feature/today-widget',
      base: 'main',
      createdAt: days(2),
      updatedAt: hours(16),
      mergedAt: hours(16),
      htmlUrl: '#',
    },
    {
      number: 45,
      title: 'refactor: TaskViewModel 분리',
      state: 'closed',
      draft: false,
      user: 'Architecture Agent',
      head: 'refactor/viewmodel-split',
      base: 'main',
      createdAt: days(6),
      updatedAt: days(5),
      mergedAt: days(5),
      htmlUrl: '#',
    },
  ],
  'demo-proj-002': [
    {
      number: 23,
      title: 'feat(crypto): E2E 암호화 구현',
      state: 'open',
      draft: false,
      user: 'Architecture Agent',
      head: 'feature/e2e-crypto',
      base: 'develop',
      createdAt: days(1),
      updatedAt: hours(3),
      mergedAt: null,
      htmlUrl: '#',
    },
    {
      number: 22,
      title: 'chore: Next.js 15 업그레이드',
      state: 'closed',
      draft: false,
      user: 'Kim Jintak',
      head: 'chore/upgrade-next-15',
      base: 'main',
      createdAt: days(3),
      updatedAt: days(2),
      mergedAt: days(2),
      htmlUrl: '#',
    },
  ],
}

export function getDemoPulls(projectId: string, state: 'open' | 'closed' | 'all' = 'open'): PullDef[] {
  const all = pullMap[projectId] ?? pullMap['demo-proj-001']
  if (state === 'all') return all
  return all.filter((p) => p.state === state)
}

export function getDemoPullDetail(projectId: string, number: number) {
  const all = pullMap[projectId] ?? pullMap['demo-proj-001']
  const pr = all.find((p) => p.number === number) ?? all[0]
  return {
    ...pr,
    body:
      pr.title.startsWith('fix(login)')
        ? '## 원인\nLoginViewModel의 `password!` 강제 언랩에서 크래시.\n\n## 수정\n`guard let` 으로 교체 + 빈 문자열 가드.\n\n## 테스트\n- 빈 pwd로 로그인 시도 → 에러 메시지 표시 (크래시 없음)\n- 정상 로그인 → 대시보드 이동\n\nCloses #214'
        : pr.title.startsWith('feat: Apple')
          ? '## 계획\n- Sign In with Apple 버튼 추가\n- AuthService에 apple provider 연동\n- 기존 Email 로그인과 공존\n\n## TODO\n- [ ] Privacy Policy 업데이트\n- [ ] iOS 13 미만 처리\n'
          : pr.title.startsWith('feat(crypto)')
            ? '## 구현\n- Argon2id로 master key 파생\n- 파일별 AES-256-GCM 세션 키\n- 세션 키는 master key로 래핑\n\n## 성능\n- 업로드 대비 오버헤드 ~3% (블록 단위 병렬)\n'
            : 'PR 설명 (demo)',
    merged: pr.mergedAt !== null,
    mergeable: true,
    headSha: 'a7f9c3298b7f',
    additions: pr.number * 13,
    deletions: pr.number * 5,
    files:
      pr.title.startsWith('fix(login)')
        ? [
            {
              filename: 'Sources/Login/LoginViewModel.swift',
              status: 'modified',
              additions: 8,
              deletions: 3,
              patch: `@@ -38,11 +38,16 @@ class LoginViewModel: ObservableObject {

   func submit() async -> LoginResult {
-    let pwd = password!
+    guard let pwd = password, !pwd.isEmpty else {
+      error = "비밀번호를 입력해주세요"
+      return .invalidInput
+    }
     do {
       let user = try await auth.signIn(email: email, password: pwd)
       return .success(user)
     } catch {
       self.error = error.localizedDescription
       return .failure
     }
   }
 }`,
            },
            {
              filename: 'Tests/LoginViewModelTests.swift',
              status: 'added',
              additions: 22,
              deletions: 0,
              patch: `@@ -0,0 +1,22 @@
+import XCTest
+@testable import SwiftBoard
+
+final class LoginViewModelTests: XCTestCase {
+  func testEmptyPasswordDoesNotCrash() async {
+    let vm = LoginViewModel()
+    vm.email = "x@y.com"
+    vm.password = ""
+    let result = await vm.submit()
+    XCTAssertEqual(result, .invalidInput)
+  }
+
+  func testNilPassword() async {
+    let vm = LoginViewModel()
+    vm.email = "x@y.com"
+    vm.password = nil
+    let result = await vm.submit()
+    XCTAssertEqual(result, .invalidInput)
+  }
+}`,
            },
          ]
        : [
            {
              filename: 'README.md',
              status: 'modified',
              additions: 3,
              deletions: 1,
              patch: `@@ -1,5 +1,7 @@
-# ${pr.title}
+# ${pr.title}
+
+Demo PR — auto-generated by agent pipeline.

 ## Usage
 ...`,
            },
          ],
    reviews:
      pr.state === 'closed' || pr.number === 48
        ? [
            {
              user: 'Kim Jintak',
              state: pr.number === 48 ? 'APPROVED' : 'APPROVED',
              body: pr.number === 48 ? 'guard let 정석적 처리. 테스트도 좋습니다. LGTM ✅' : '머지 완료 ✓',
              submittedAt: pr.updatedAt,
            },
          ]
        : [],
  }
}

export function getDemoCiStatus(_projectId: string, _sha: string) {
  return {
    state: 'success' as const,
    totalCount: 3,
    statuses: [
      { context: 'ci/build', state: 'success', description: 'Build succeeded in 3m 42s', targetUrl: '#' },
      { context: 'ci/test', state: 'success', description: '128 tests passed', targetUrl: '#' },
      { context: 'ci/lint', state: 'success', description: 'ESLint clean', targetUrl: '#' },
    ],
  }
}
