import { demoProjects, getDemoProject, getDemoProjectProgress } from './data/projects'
import { getDemoWorkItems } from './data/work-items'
import { getDemoRequirements } from './data/requirements'
import { getDemoDesignArtifacts, getDemoDesignArtifact } from './data/design'
import { getDemoTestCases, getDemoCoverage } from './data/qa'
import { getDemoChat } from './data/chat'
import { getDemoFeedback } from './data/feedback'
import { getDemoReleases, getDemoRelease } from './data/releases'
import { demoCustomers, demoOpportunities } from './data/crm'
import { demoAgentCards, demoAgentTasks } from './data/agents'
import { demoInboxItems } from './data/messages'
import { demoOpsSummary, demoStalled, demoWatchKeywords, demoFeed } from './data/admin-ops'

interface RouteHandler {
  pattern: RegExp
  method?: string
  handler: (match: RegExpMatchArray, params?: Record<string, string>) => unknown
}

// Helper: resolve project ID — if not a known demo project, return first demo project
function resolveProjectId(id: string): string {
  const known = demoProjects.find((p) => p.id === id)
  return known ? id : 'demo-proj-001'
}

// Use [^/]+ to match any ID (UUID, demo-proj-xxx, etc.)
const PID = '([^/]+)' // project id capture group

const routes: RouteHandler[] = [
  // Auth
  { pattern: /^\/api\/auth\/me$/, handler: () => ({ id: 'demo-user-admin', email: 'demo@agency.ai', name: 'Demo Admin', role: 'ADMIN' }) },
  { pattern: /^\/api\/auth\/refresh$/, method: 'POST', handler: () => ({ accessToken: 'demo-token', refreshToken: 'demo-refresh' }) },

  // Projects
  { pattern: /^\/api\/projects$/, method: 'GET', handler: () => demoProjects },
  { pattern: /^\/api\/projects$/, method: 'POST', handler: () => demoProjects[0] },
  { pattern: new RegExp(`^/api/projects/${PID}$`), method: 'GET', handler: (m) => getDemoProject(resolveProjectId(m[1])) },
  { pattern: new RegExp(`^/api/projects/${PID}/progress$`), handler: (m) => getDemoProjectProgress(resolveProjectId(m[1])) },

  // Work Items
  { pattern: new RegExp(`^/api/projects/${PID}/work-items$`), method: 'GET', handler: (m) => getDemoWorkItems(resolveProjectId(m[1])) },
  { pattern: new RegExp(`^/api/projects/${PID}/work-items/[^/]+/status$`), method: 'PATCH', handler: () => ({ success: true }) },
  { pattern: /^\/api\/work-items$/, method: 'GET', handler: (_m, params) => getDemoWorkItems(resolveProjectId(params?.projectId ?? 'demo-proj-001')) },

  // Requirements
  { pattern: /^\/api\/requirements/, method: 'GET', handler: (_m, params) => getDemoRequirements(resolveProjectId(params?.projectId ?? 'demo-proj-001')) },
  { pattern: /^\/api\/requirements$/, method: 'POST', handler: () => ({ id: 'demo-req-new', success: true }) },
  { pattern: /^\/api\/requirements\/generate/, method: 'POST', handler: () => ({ title: 'Generated Requirement', featureFile: 'Feature: Demo\n  Scenario: Generated\n    Given demo\n    When run\n    Then pass', platforms: ['WEB'] }) },

  // Design
  { pattern: /^\/api\/design$/, method: 'GET', handler: (_m, params) => getDemoDesignArtifacts(resolveProjectId(params?.projectId ?? 'demo-proj-001'), params?.type) },
  { pattern: /^\/api\/design\/([^/]+)$/, method: 'GET', handler: (m) => getDemoDesignArtifact(m[1]) ?? getDemoDesignArtifacts('demo-proj-001')[0] },
  { pattern: /^\/api\/design\/([^/]+)\/versions$/, handler: (m) => getDemoDesignArtifact(m[1])?.versions ?? [] },
  { pattern: /^\/api\/design$/, method: 'POST', handler: () => ({ id: 'demo-design-new', success: true }) },

  // QA
  { pattern: /^\/api\/qa\/test-cases$/, method: 'GET', handler: (_m, params) => getDemoTestCases(params?.workItemId) },
  { pattern: /^\/api\/qa\/test-cases$/, method: 'POST', handler: () => ({ id: 'demo-tc-new', success: true }) },
  { pattern: new RegExp(`^/api/qa/coverage/${PID}$`), handler: (m) => getDemoCoverage(resolveProjectId(m[1])) },
  { pattern: /^\/api\/qa\/test-runs/, handler: () => [] },

  // Chat
  { pattern: new RegExp(`^/api/projects/${PID}/chat$`), method: 'GET', handler: (m) => getDemoChat(resolveProjectId(m[1])) },
  { pattern: new RegExp(`^/api/projects/${PID}/chat$`), method: 'POST', handler: () => ({
    id: `demo-chat-${Date.now()}`, projectId: 'demo-proj-001', authorType: 'USER', authorId: 'demo-user', authorName: 'Demo Admin',
    kind: 'TEXT', body: '(Demo mode — 메시지가 저장되지 않습니다)', metadata: null, createdAt: new Date().toISOString(),
  }) },
  { pattern: new RegExp(`^/api/projects/${PID}/chat/read$`), method: 'POST', handler: () => ({}) },

  // Feedback
  { pattern: new RegExp(`^/api/projects/${PID}/feedback$`), method: 'GET', handler: (m) => getDemoFeedback(resolveProjectId(m[1])) },
  { pattern: new RegExp(`^/api/projects/${PID}/feedback$`), method: 'POST', handler: () => ({ id: 'demo-fb-new', success: true }) },
  { pattern: /^\/api\/feedback\/[^/]+$/, method: 'GET', handler: () => getDemoFeedback('demo-proj-001')[0] },
  { pattern: new RegExp(`^/api/projects/${PID}/feedback/similar$`), handler: () => [] },

  // Releases
  { pattern: new RegExp(`^/api/projects/${PID}/releases$`), method: 'GET', handler: (m) => getDemoReleases(resolveProjectId(m[1])) },
  { pattern: new RegExp(`^/api/projects/${PID}/releases$`), method: 'POST', handler: () => ({ id: 'demo-rel-new', success: true }) },
  { pattern: /^\/api\/releases\/([^/]+)$/, method: 'GET', handler: (m) => getDemoRelease(m[1]) ?? getDemoReleases('demo-proj-001')[0] },
  { pattern: /^\/api\/releases\/([^/]+)\/status$/, method: 'PATCH', handler: () => ({ success: true }) },
  { pattern: /^\/api\/releases\/([^/]+)\/deploy$/, method: 'POST', handler: () => ({ success: true }) },
  { pattern: /^\/api\/releases\/([^/]+)\/rollback$/, method: 'POST', handler: () => ({ success: true }) },
  { pattern: /^\/api\/builds\/[^/]+\/download$/, handler: () => ({ url: '#demo-download' }) },
  { pattern: new RegExp(`^/api/projects/${PID}/deploy-history$`), handler: () => [] },

  // CRM
  { pattern: /^\/api\/customers$/, method: 'GET', handler: () => demoCustomers },
  { pattern: /^\/api\/customers\/[^/]+$/, method: 'GET', handler: () => demoCustomers[0] },
  { pattern: /^\/api\/customers$/, method: 'POST', handler: () => demoCustomers[0] },
  { pattern: /^\/api\/opportunities$/, method: 'GET', handler: () => demoOpportunities },
  { pattern: /^\/api\/contracts$/, handler: () => [] },

  // Agents
  { pattern: /^\/api\/agents$/, method: 'GET', handler: () => demoAgentCards },
  { pattern: /^\/api\/agents\/tasks\/list$/, handler: () => demoAgentTasks },
  { pattern: /^\/api\/agents\/tasks$/, method: 'POST', handler: () => ({ id: 'demo-task-new', success: true }) },

  // Messages
  { pattern: /^\/api\/chat\/inbox$/, handler: () => demoInboxItems },

  // Admin Ops
  { pattern: /^\/api\/admin\/ops\/summary$/, handler: () => demoOpsSummary },
  { pattern: /^\/api\/admin\/ops\/feed$/, handler: () => demoFeed },
  { pattern: /^\/api\/admin\/ops\/stalled$/, handler: () => demoStalled },
  { pattern: /^\/api\/admin\/watchlist$/, method: 'GET', handler: () => demoWatchKeywords },
  { pattern: /^\/api\/admin\/watchlist$/, method: 'POST', handler: () => ({ id: 'demo-wk-new', success: true }) },
  { pattern: /^\/api\/admin\/watchlist\/[^/]+$/, method: 'DELETE', handler: () => ({}) },
  { pattern: /^\/api\/admin\/watchlist\/[^/]+$/, method: 'PATCH', handler: () => ({ success: true }) },
  { pattern: /^\/api\/admin\/audit$/, handler: () => [] },

  // Portal
  { pattern: /^\/api\/portal\/projects$/, handler: () => demoProjects },
  { pattern: new RegExp(`^/api/portal/projects/${PID}/progress$`), handler: (m) => getDemoProjectProgress(resolveProjectId(m[1])) },
  { pattern: new RegExp(`^/api/portal/projects/${PID}/builds$`), handler: (m) => getDemoReleases(resolveProjectId(m[1])).flatMap((r) => r.builds) },
  { pattern: new RegExp(`^/api/portal/projects/${PID}/requirements$`), handler: (m) => getDemoRequirements(resolveProjectId(m[1])) },
  { pattern: /^\/api\/portal\/feedback$/, handler: () => getDemoFeedback('demo-proj-001') },

  // CRM Notifications
  { pattern: /^\/api\/crm\/notifications/, handler: () => [] },
]

export function resolveDemoData(url: string, method: string, params?: Record<string, string>): unknown | null {
  const upperMethod = method.toUpperCase()

  for (const route of routes) {
    if (route.method && route.method !== upperMethod) continue
    const match = url.match(route.pattern)
    if (match) {
      return route.handler(match, params)
    }
  }

  // Fallback: return empty array for GET, success for mutations
  if (upperMethod === 'GET') return []
  return { success: true }
}
