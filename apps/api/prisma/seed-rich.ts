import {
  PrismaClient,
  UserRole,
  AgentType,
  AgentStatus,
  ProjectStatus,
  Platform,
  OpportunityStage,
  WorkItemType,
  WorkItemStatus,
  Priority,
  RequirementStatus,
  FeedbackSource,
  FeedbackType,
  FeedbackStatus,
  ChatAuthorType,
  ChatMessageKind,
} from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('→ Clearing existing rich-seed rows...')
  // Keep users + agent cards from base seed; reset project-related data only.
  await prisma.chatMessage.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.testResult.deleteMany()
  await prisma.testRun.deleteMany()
  await prisma.testCase.deleteMany()
  await prisma.agentTask.deleteMany()
  await prisma.workItemDependency.deleteMany()
  await prisma.requirementLink.deleteMany()
  await prisma.requirementVersion.deleteMany()
  await prisma.requirement.deleteMany()
  await prisma.build.deleteMany()
  await prisma.releaseItem.deleteMany()
  await prisma.release.deleteMany()
  await prisma.workItem.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.project.deleteMany()
  await prisma.portalUser.deleteMany()
  await prisma.customer.deleteMany({ where: { companyName: { not: 'Demo Corp' } } })

  // ── Customers ───────────────────────────────────
  console.log('→ Customers')
  const acme = await prisma.customer.create({
    data: {
      companyName: 'Acme 커머스',
      contactName: '김대표',
      email: 'ceo@acme.kr',
      phone: '02-555-1234',
      address: '서울시 강남구',
      notes: '모바일 주문 앱 + 관리자 대시보드',
    },
  })
  const beacon = await prisma.customer.create({
    data: {
      companyName: 'Beacon 로지스틱스',
      contactName: '이기획',
      email: 'lead@beacon.co.kr',
      phone: '031-200-0001',
      notes: '창고 재고 관리 SaaS',
    },
  })
  const cirrus = await prisma.customer.create({
    data: {
      companyName: 'Cirrus 헬스케어',
      contactName: '박본부',
      email: 'ops@cirrus.health',
      notes: 'iPad 진료 기록 앱',
    },
  })
  const delta = await prisma.customer.create({
    data: {
      companyName: 'Delta 에듀',
      contactName: '정대표',
      email: 'hello@delta.edu',
      notes: '강의 스트리밍 + LMS',
    },
  })

  // ── Opportunities ───────────────────────────────
  console.log('→ Opportunities')
  await prisma.opportunity.createMany({
    data: [
      {
        customerId: acme.id,
        title: '모바일 주문 앱 1차 개발',
        stage: OpportunityStage.CONTRACT,
        estimatedValue: 120_000_000,
        description: 'iOS + Android 앱 + 관리자 웹',
        expectedCloseDate: new Date('2026-05-01'),
      },
      {
        customerId: beacon.id,
        title: '창고 재고 관리 시스템 V2',
        stage: OpportunityStage.NEGOTIATION,
        estimatedValue: 80_000_000,
        expectedCloseDate: new Date('2026-06-15'),
      },
      {
        customerId: cirrus.id,
        title: 'iPad 진료 기록 앱 PoC',
        stage: OpportunityStage.LEAD,
        estimatedValue: 45_000_000,
        expectedCloseDate: new Date('2026-07-30'),
      },
      {
        customerId: delta.id,
        title: 'LMS 영상 스트리밍 모듈',
        stage: OpportunityStage.COMPLETED,
        estimatedValue: 60_000_000,
        description: '2026 Q1 완료',
      },
    ],
  })

  // ── Projects ─────────────────────────────────────
  console.log('→ Projects')
  const acmeMobile = await prisma.project.create({
    data: {
      customerId: acme.id,
      name: 'Acme 모바일 주문',
      description: 'iOS·Android 모바일 주문 앱 + 관리자 대시보드',
      status: ProjectStatus.ACTIVE,
      platforms: [Platform.IOS, Platform.ANDROID, Platform.WEB],
      githubRepo: 'acme/mobile-ordering',
    },
  })
  const beaconWms = await prisma.project.create({
    data: {
      customerId: beacon.id,
      name: 'Beacon WMS V2',
      description: '창고 재고 실시간 추적 + 바코드 스캔',
      status: ProjectStatus.ACTIVE,
      platforms: [Platform.WEB, Platform.ANDROID],
      githubRepo: 'beacon/wms-v2',
    },
  })
  const cirrusEmr = await prisma.project.create({
    data: {
      customerId: cirrus.id,
      name: 'Cirrus EMR Pad',
      description: 'iPad용 전자 의무기록 작성 앱',
      status: ProjectStatus.ON_HOLD,
      platforms: [Platform.IOS],
    },
  })
  const deltaLms = await prisma.project.create({
    data: {
      customerId: delta.id,
      name: 'Delta LMS',
      description: '영상 강의 + 시험 + 수강 이력',
      status: ProjectStatus.COMPLETED,
      platforms: [Platform.WEB, Platform.IOS],
    },
  })

  const projects = [acmeMobile, beaconWms, cirrusEmr, deltaLms]

  // ── Project Members (admin + PM assigned to all) ──
  console.log('→ Project members')
  const admin = await prisma.user.findUnique({ where: { email: 'admin@agency.dev' } })
  const pm = await prisma.user.findUnique({ where: { email: 'pm@agency.dev' } })
  for (const p of projects) {
    if (admin) {
      await prisma.projectMember.create({
        data: { projectId: p.id, userId: admin.id, role: UserRole.ADMIN },
      })
    }
    if (pm) {
      await prisma.projectMember.create({
        data: { projectId: p.id, userId: pm.id, role: UserRole.PM },
      })
    }
  }

  // ── Requirements (Acme 모바일) ───────────────────
  console.log('→ Requirements')
  const req1 = await prisma.requirement.create({
    data: {
      projectId: acmeMobile.id,
      title: '사용자 로그인',
      featureFile:
        '@ios @android\nFeature: Login\n  Scenario: Email 로그인\n    Given 가입된 이메일이 있을 때\n    When 올바른 비밀번호를 입력하면\n    Then 대시보드로 이동한다',
      platforms: [Platform.IOS, Platform.ANDROID],
      status: RequirementStatus.APPROVED,
      version: 2,
    },
  })
  const req2 = await prisma.requirement.create({
    data: {
      projectId: acmeMobile.id,
      title: '메뉴 카테고리 탐색',
      featureFile:
        '@ios @android\nFeature: Menu Browse\n  Scenario: 카테고리 필터\n    Given 카테고리 목록이 표시될 때\n    When 카테고리를 선택하면\n    Then 해당 메뉴만 보인다',
      platforms: [Platform.IOS, Platform.ANDROID],
      status: RequirementStatus.PENDING_APPROVAL,
      version: 1,
    },
  })
  const req3 = await prisma.requirement.create({
    data: {
      projectId: acmeMobile.id,
      title: '장바구니 결제',
      featureFile:
        '@ios @android @web\nFeature: Checkout\n  Scenario: Apple Pay 결제\n    Given 장바구니에 상품이 있을 때\n    When Apple Pay로 결제하면\n    Then 주문 확인 화면이 표시된다',
      platforms: [Platform.IOS, Platform.ANDROID, Platform.WEB],
      status: RequirementStatus.DRAFT,
      version: 1,
    },
  })

  // ── Work Items ───────────────────────────────────
  console.log('→ Work Items')
  await prisma.workItem.createMany({
    data: [
      {
        projectId: acmeMobile.id,
        title: 'LoginView SwiftUI 구현',
        description: 'REQ-001 로그인 화면 iOS',
        type: WorkItemType.STORY,
        status: WorkItemStatus.DONE,
        priority: Priority.P1,
        platform: Platform.IOS,
      },
      {
        projectId: acmeMobile.id,
        title: 'LoginActivity Android 구현',
        type: WorkItemType.STORY,
        status: WorkItemStatus.REVIEW,
        priority: Priority.P1,
        platform: Platform.ANDROID,
      },
      {
        projectId: acmeMobile.id,
        title: 'MenuListScreen (카테고리 필터)',
        type: WorkItemType.STORY,
        status: WorkItemStatus.IN_PROGRESS,
        priority: Priority.P2,
        platform: Platform.IOS,
      },
      {
        projectId: acmeMobile.id,
        title: 'Apple Pay SDK 통합',
        type: WorkItemType.TASK,
        status: WorkItemStatus.BACKLOG,
        priority: Priority.P1,
        platform: Platform.IOS,
      },
      {
        projectId: acmeMobile.id,
        title: '주문 확인 이메일 발송',
        type: WorkItemType.TASK,
        status: WorkItemStatus.BACKLOG,
        priority: Priority.P2,
        platform: Platform.WEB,
      },
      {
        projectId: beaconWms.id,
        title: '바코드 스캔 모듈',
        type: WorkItemType.STORY,
        status: WorkItemStatus.IN_PROGRESS,
        priority: Priority.P1,
        platform: Platform.ANDROID,
      },
      {
        projectId: beaconWms.id,
        title: '실시간 재고 웹소켓',
        type: WorkItemType.TASK,
        status: WorkItemStatus.BACKLOG,
        priority: Priority.P2,
        platform: Platform.WEB,
      },
      {
        projectId: deltaLms.id,
        title: 'HLS 스트리밍 플레이어',
        type: WorkItemType.STORY,
        status: WorkItemStatus.DONE,
        priority: Priority.P1,
        platform: Platform.WEB,
      },
    ],
  })

  // ── Feedback ────────────────────────────────────
  console.log('→ Feedback')
  await prisma.feedback.createMany({
    data: [
      {
        projectId: acmeMobile.id,
        source: FeedbackSource.PORTAL,
        type: FeedbackType.BUG,
        severity: Priority.P0,
        status: FeedbackStatus.IN_PROGRESS,
        title: '빈 비밀번호로 로그인 시도 시 앱 크래시',
        body: 'iOS 17.4에서 비밀번호 필드 비워놓고 로그인 버튼 누르면 앱이 종료됩니다.',
      },
      {
        projectId: acmeMobile.id,
        source: FeedbackSource.PORTAL,
        type: FeedbackType.FEATURE,
        severity: Priority.P2,
        status: FeedbackStatus.TRIAGED,
        title: 'Apple Sign-In 지원 요청',
        body: 'Email 외에 Apple ID로도 로그인할 수 있으면 좋겠습니다.',
      },
      {
        projectId: acmeMobile.id,
        source: FeedbackSource.SENTRY,
        type: FeedbackType.BUG,
        severity: Priority.P1,
        status: FeedbackStatus.NEW,
        title: 'OrderService NullPointerException',
        body: 'Stack: OrderService.java:142\nat submitOrder(OrderService.java:142)',
      },
      {
        projectId: beaconWms.id,
        source: FeedbackSource.PORTAL,
        type: FeedbackType.IMPROVEMENT,
        severity: Priority.P3,
        status: FeedbackStatus.NEW,
        title: '바코드 스캔 후 확인 버튼 위치',
        body: '왼손으로 스캔할 때 확인 버튼이 오른쪽 하단에 있어 불편합니다.',
      },
      {
        projectId: deltaLms.id,
        source: FeedbackSource.API,
        type: FeedbackType.QUESTION,
        severity: Priority.P3,
        status: FeedbackStatus.RESOLVED,
        title: '수강 이력 CSV 내보내기 방법',
        body: '관리자 대시보드에서 월별 수강 이력을 CSV로 받을 수 있나요?',
      },
    ],
  })

  // ── Chat messages (Acme 모바일) ──────────────────
  console.log('→ Chat messages')
  const chatRows = [
    { authorType: ChatAuthorType.USER, authorName: 'PM 김지훈', body: '로그인 화면부터 시작하겠습니다.', kind: ChatMessageKind.TEXT, ago: 120 },
    { authorType: ChatAuthorType.USER, authorName: 'PM 김지훈', body: '/task @MAC_DEV code_generation REQ-001', kind: ChatMessageKind.COMMAND, ago: 115 },
    { authorType: ChatAuthorType.SYSTEM, authorName: 'System', body: '태스크 디스패치 완료 → @MAC_DEV · code_generation · REQ-001', kind: ChatMessageKind.STATUS, ago: 114 },
    { authorType: ChatAuthorType.AGENT, authorName: 'MAC_DEV 에이전트', body: '요구사항 분석 중... (10%)', kind: ChatMessageKind.AGENT_UPDATE, ago: 110 },
    { authorType: ChatAuthorType.AGENT, authorName: 'MAC_DEV 에이전트', body: 'LoginView.swift 생성 중... (60%)', kind: ChatMessageKind.AGENT_UPDATE, ago: 95 },
    { authorType: ChatAuthorType.USER, authorName: '이소라', body: 'Apple Sign-In도 이번 스프린트에 넣을 수 있나요?', kind: ChatMessageKind.TEXT, ago: 80 },
    { authorType: ChatAuthorType.USER, authorName: 'PM 김지훈', body: '이번은 Email 로그인만. Apple Sign-In은 REQ-004에서 다룰게요.', kind: ChatMessageKind.TEXT, ago: 75 },
    { authorType: ChatAuthorType.AGENT, authorName: 'MAC_DEV 에이전트', body: 'LoginView.swift 생성 완료 (100%)', kind: ChatMessageKind.AGENT_UPDATE, ago: 40 },
    { authorType: ChatAuthorType.SYSTEM, authorName: 'System', body: '태스크 완료 ✓ — PR #317 열림', kind: ChatMessageKind.STATUS, ago: 35 },
  ]
  for (const c of chatRows) {
    await prisma.chatMessage.create({
      data: {
        projectId: acmeMobile.id,
        authorType: c.authorType,
        authorId: c.authorType === 'SYSTEM' ? 'system' : `seed-${c.authorName}`,
        authorName: c.authorName,
        kind: c.kind,
        body: c.body,
        createdAt: new Date(Date.now() - c.ago * 60_000),
      },
    })
  }

  // Also seed a few chat messages on Beacon for inbox variety
  await prisma.chatMessage.createMany({
    data: [
      {
        projectId: beaconWms.id,
        authorType: ChatAuthorType.USER,
        authorId: 'seed-pm',
        authorName: 'PM 박소영',
        kind: ChatMessageKind.TEXT,
        body: '재고 웹소켓 스파이크 이번 주까지 검토 부탁드립니다.',
      },
      {
        projectId: beaconWms.id,
        authorType: ChatAuthorType.AGENT,
        authorId: 'seed-agent',
        authorName: 'ANDROID 에이전트',
        kind: ChatMessageKind.AGENT_UPDATE,
        body: '바코드 스캐너 라이브러리 호환성 체크 완료',
      },
    ],
  })

  // ── Some agents ONLINE ─────────────────────────
  console.log('→ Agent status')
  await prisma.agentCard.updateMany({
    where: { agentType: { in: [AgentType.MAC_DEV, AgentType.AWS_DEV, AgentType.QA, AgentType.PM] } },
    data: { status: AgentStatus.ONLINE },
  })
  await prisma.agentCard.updateMany({
    where: { agentType: AgentType.ARCHITECTURE },
    data: { status: AgentStatus.BUSY },
  })

  // ── Portal user for Acme ───────────────────────
  console.log('→ Portal user')
  const portalHash = await bcrypt.hash('client1234!', 10)
  await prisma.portalUser.upsert({
    where: { email: 'client@acme.kr' },
    update: {},
    create: {
      customerId: acme.id,
      email: 'client@acme.kr',
      passwordHash: portalHash,
      name: 'Acme 담당자',
    },
  })

  console.log('\n✓ Rich seed complete.')
  console.log('  Admin:  admin@agency.dev / admin1234!')
  console.log('  PM:     pm@agency.dev / pm1234!')
  console.log('  Portal: client@acme.kr / client1234!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
