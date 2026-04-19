const now = Date.now()

function rel(id: string, projectId: string, version: string, status: string, daysAgo: number, platforms: string[], builds: Array<{ platform: string; status: string }>) {
  return {
    id, projectId, version, status,
    title: null as string | null,
    platforms,
    approvedAt: (status === 'APPROVED' || status === 'DEPLOYED' || status === 'DEPLOYING') ? new Date(now - (daysAgo + 1) * 86400000).toISOString() : null,
    deployedAt: status === 'DEPLOYED' ? new Date(now - daysAgo * 86400000).toISOString() : null,
    notes: `${version} 릴리스 노트`,
    createdAt: new Date(now - (daysAgo + 3) * 86400000).toISOString(),
    updatedAt: new Date(now - daysAgo * 86400000).toISOString(),
    _count: { releaseItems: 3, builds: builds.length, testRuns: 1 },
    builds: builds.map((b, i) => ({
      id: `${id}-build-${i}`,
      releaseId: id,
      platform: b.platform,
      status: b.status,
      s3Key: b.status === 'SUCCESS' ? `builds/${id}/${b.platform.toLowerCase()}.zip` : null,
      cloudfrontUrl: b.status === 'SUCCESS' ? `https://cdn.example.com/${id}/${b.platform.toLowerCase()}.zip` : null,
      buildLog: b.status === 'FAILED' ? 'Error: Build failed — missing provisioning profile' : null,
      startedAt: new Date(now - (daysAgo + 0.5) * 86400000).toISOString(),
      completedAt: b.status !== 'BUILDING' && b.status !== 'PENDING' ? new Date(now - daysAgo * 86400000).toISOString() : null,
      artifactUrl: b.status === 'SUCCESS' ? `https://cdn.example.com/${id}/${b.platform.toLowerCase()}.zip` : null,
      createdAt: new Date(now - (daysAgo + 0.5) * 86400000).toISOString(),
    })),
    releaseItems: [
      { workItem: { id: 'demo-wi-101', title: '사용자 인증 시스템', status: 'DONE', type: 'EPIC' } },
      { workItem: { id: 'demo-wi-103', title: 'Apple ID 소셜 로그인', status: 'DONE', type: 'STORY' } },
      { workItem: { id: 'demo-wi-104', title: '이메일/비밀번호 로그인', status: 'DONE', type: 'STORY' } },
    ],
  }
}

const data: Record<string, ReturnType<typeof rel>[]> = {
  'demo-proj-001': [
    rel('demo-rel-101', 'demo-proj-001', 'v0.3.0', 'TESTING', 1, ['MACOS', 'IOS'], [
      { platform: 'MACOS', status: 'SUCCESS' },
      { platform: 'IOS', status: 'BUILDING' },
    ]),
    rel('demo-rel-102', 'demo-proj-001', 'v0.2.0', 'DEPLOYED', 10, ['MACOS', 'IOS'], [
      { platform: 'MACOS', status: 'SUCCESS' },
      { platform: 'IOS', status: 'SUCCESS' },
    ]),
    rel('demo-rel-103', 'demo-proj-001', 'v0.1.0', 'DEPLOYED', 25, ['MACOS'], [
      { platform: 'MACOS', status: 'SUCCESS' },
    ]),
  ],
  'demo-proj-002': [
    rel('demo-rel-201', 'demo-proj-002', 'v0.2.0-beta', 'DRAFT', 0, ['MACOS', 'WINDOWS', 'WEB'], []),
    rel('demo-rel-202', 'demo-proj-002', 'v0.1.0', 'DEPLOYED', 15, ['WEB', 'MACOS', 'WINDOWS'], [
      { platform: 'WEB', status: 'SUCCESS' },
      { platform: 'MACOS', status: 'SUCCESS' },
      { platform: 'WINDOWS', status: 'FAILED' },
    ]),
  ],
  'demo-proj-003': [
    rel('demo-rel-301', 'demo-proj-003', 'v0.1.0-alpha', 'TESTING', 6, ['IOS', 'ANDROID'], [
      { platform: 'IOS', status: 'SUCCESS' },
      { platform: 'ANDROID', status: 'PENDING' },
    ]),
  ],
  'demo-proj-004': [
    rel('demo-rel-401', 'demo-proj-004', 'v1.0.0', 'DEPLOYED', 3, ['WEB'], [
      { platform: 'WEB', status: 'SUCCESS' },
    ]),
    rel('demo-rel-402', 'demo-proj-004', 'v0.9.0', 'DEPLOYED', 15, ['WEB'], [
      { platform: 'WEB', status: 'SUCCESS' },
    ]),
  ],
}

export function getDemoReleases(projectId: string) {
  return data[projectId] ?? []
}

export function getDemoRelease(id: string) {
  for (const items of Object.values(data)) {
    const found = items.find((r) => r.id === id)
    if (found) return found
  }
  return null
}
