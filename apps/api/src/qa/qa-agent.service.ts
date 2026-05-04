import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface RegressionRiskItem {
  workItemId: string
  workItemTitle: string
  workItemStatus: string
  testCaseCount: number
  failedCaseCount: number
  failureRate: number
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  recentFailures: {
    testCaseId: string
    testCaseTitle: string
    failCount: number
    lastFailedAt: string
  }[]
}

@Injectable()
export class QaAgentService {
  private readonly logger = new Logger(QaAgentService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * FR-07-06: 테스트 실패 패턴을 분석하여 회귀 위험 WorkItem 목록 반환.
   * - 각 TestCase의 최근 N회 결과를 집계
   * - 실패율 ≥ 70% → HIGH / ≥ 40% → MEDIUM / ≥ 20% → LOW
   */
  async analyzeRegressionRisk(projectId: string, lookback = 10): Promise<RegressionRiskItem[]> {
    const testCases = await this.prisma.testCase.findMany({
      where: { workItem: { projectId } },
      include: {
        workItem: { select: { id: true, title: true, status: true } },
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: lookback,
          select: { id: true, status: true, createdAt: true },
        },
      },
    })

    if (testCases.length === 0) return []

    // Group by WorkItem
    const byWorkItem = new Map<
      string,
      {
        workItem: { id: string; title: string; status: string }
        cases: {
          id: string
          title: string
          failCount: number
          totalCount: number
          lastFailedAt: string | null
        }[]
      }
    >()

    for (const tc of testCases) {
      if (!tc.workItem) continue
      if (!byWorkItem.has(tc.workItem.id)) {
        byWorkItem.set(tc.workItem.id, { workItem: tc.workItem, cases: [] })
      }
      const failedResults = tc.testResults.filter((r) => r.status === 'FAILED')
      const lastFailed = failedResults[0]?.createdAt ?? null
      byWorkItem.get(tc.workItem.id)!.cases.push({
        id: tc.id,
        title: tc.title,
        failCount: failedResults.length,
        totalCount: tc.testResults.length,
        lastFailedAt: lastFailed ? lastFailed.toISOString() : null,
      })
    }

    const result: RegressionRiskItem[] = []

    for (const { workItem, cases } of byWorkItem.values()) {
      // Only consider cases that have at least 1 result
      const caseWithResults = cases.filter((c) => c.totalCount > 0)
      if (caseWithResults.length === 0) continue

      const failedCaseCount = caseWithResults.filter((c) => c.failCount > 0).length
      const failureRate =
        caseWithResults.reduce((sum, c) => sum + c.failCount / c.totalCount, 0) /
        caseWithResults.length

      if (failureRate < 0.1) continue // 10% 미만은 위험 없음

      const riskLevel: RegressionRiskItem['riskLevel'] =
        failureRate >= 0.7 ? 'HIGH' : failureRate >= 0.4 ? 'MEDIUM' : 'LOW'

      result.push({
        workItemId: workItem.id,
        workItemTitle: workItem.title,
        workItemStatus: workItem.status,
        testCaseCount: caseWithResults.length,
        failedCaseCount,
        failureRate: Math.round(failureRate * 1000) / 10,
        riskLevel,
        recentFailures: caseWithResults
          .filter((c) => c.failCount > 0)
          .map((c) => ({
            testCaseId: c.id,
            testCaseTitle: c.title,
            failCount: c.failCount,
            lastFailedAt: c.lastFailedAt ?? '',
          }))
          .sort((a, b) => b.failCount - a.failCount)
          .slice(0, 5),
      })
    }

    return result.sort((a, b) => b.failureRate - a.failureRate)
  }
}
