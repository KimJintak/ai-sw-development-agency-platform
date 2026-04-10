import { Injectable, NotFoundException } from '@nestjs/common'
import { Platform, TestResultStatus, TestRunStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateTestCaseDto,
  CreateTestRunDto,
  RecordTestResultDto,
  UpdateTestCaseDto,
  UpdateTestRunDto,
} from './dto/qa.dto'

@Injectable()
export class QaService {
  constructor(private readonly prisma: PrismaService) {}

  /* ────────── TestCase ────────── */

  findTestCases(workItemId: string, platform?: Platform) {
    return this.prisma.testCase.findMany({
      where: { workItemId, ...(platform ? { platform } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { testResults: true } } },
    })
  }

  async findTestCase(id: string) {
    const tc = await this.prisma.testCase.findUnique({
      where: { id },
      include: {
        testResults: { orderBy: { createdAt: 'desc' }, take: 20 },
        workItem: { select: { id: true, title: true, projectId: true } },
      },
    })
    if (!tc) throw new NotFoundException(`TestCase ${id} not found`)
    return tc
  }

  createTestCase(dto: CreateTestCaseDto) {
    return this.prisma.testCase.create({
      data: {
        workItemId: dto.workItemId,
        title: dto.title,
        scenario: dto.scenario,
        platform: dto.platform as Platform | undefined,
      },
    })
  }

  async updateTestCase(id: string, dto: UpdateTestCaseDto) {
    await this.findTestCase(id)
    return this.prisma.testCase.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.scenario !== undefined && { scenario: dto.scenario }),
        ...(dto.platform !== undefined && { platform: dto.platform as Platform }),
      },
    })
  }

  async removeTestCase(id: string) {
    await this.findTestCase(id)
    return this.prisma.$transaction([
      this.prisma.testResult.deleteMany({ where: { testCaseId: id } }),
      this.prisma.testCase.delete({ where: { id } }),
    ])
  }

  /* ────────── TestRun ────────── */

  findTestRuns(releaseId: string, status?: TestRunStatus) {
    return this.prisma.testRun.findMany({
      where: { releaseId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { testResults: true } } },
    })
  }

  async findTestRun(id: string) {
    const run = await this.prisma.testRun.findUnique({
      where: { id },
      include: {
        testResults: {
          orderBy: { createdAt: 'desc' },
          include: { testCase: { select: { id: true, title: true } } },
        },
        release: { select: { id: true, version: true, projectId: true } },
      },
    })
    if (!run) throw new NotFoundException(`TestRun ${id} not found`)
    return run
  }

  createTestRun(dto: CreateTestRunDto) {
    return this.prisma.testRun.create({
      data: {
        releaseId: dto.releaseId,
        platform: dto.platform as Platform,
        status: 'PENDING',
      },
    })
  }

  async updateTestRun(id: string, dto: UpdateTestRunDto) {
    const run = await this.findTestRun(id)
    const data: Record<string, unknown> = {}

    if (dto.status) {
      data.status = dto.status as TestRunStatus
      if (dto.status === 'RUNNING' && !run.startedAt) {
        data.startedAt = new Date()
      }
      if (dto.status === 'COMPLETED' || dto.status === 'FAILED') {
        data.endedAt = new Date()
      }
    }

    return this.prisma.testRun.update({ where: { id }, data })
  }

  async removeTestRun(id: string) {
    await this.findTestRun(id)
    return this.prisma.$transaction([
      this.prisma.testResult.deleteMany({ where: { testRunId: id } }),
      this.prisma.testRun.delete({ where: { id } }),
    ])
  }

  /* ────────── TestResult ────────── */

  async recordResult(testRunId: string, dto: RecordTestResultDto) {
    return this.prisma.testResult.create({
      data: {
        testRunId,
        testCaseId: dto.testCaseId,
        status: dto.status as TestResultStatus,
        duration: dto.duration,
        errorLog: dto.errorLog,
      },
    })
  }

  findResults(testRunId: string) {
    return this.prisma.testResult.findMany({
      where: { testRunId },
      orderBy: { createdAt: 'desc' },
      include: { testCase: { select: { id: true, title: true, platform: true } } },
    })
  }

  /* ────────── Aggregate helpers ────────── */

  /**
   * Returns pass/fail/skip counts for a given test run.
   */
  async getRunSummary(testRunId: string) {
    const results = await this.prisma.testResult.groupBy({
      by: ['status'],
      where: { testRunId },
      _count: { status: true },
    })
    const summary = { passed: 0, failed: 0, skipped: 0, total: 0 }
    for (const r of results) {
      const count = r._count.status
      summary.total += count
      if (r.status === 'PASSED') summary.passed = count
      else if (r.status === 'FAILED') summary.failed = count
      else if (r.status === 'SKIPPED') summary.skipped = count
    }
    return summary
  }

  /**
   * Project-level test coverage: counts test cases linked
   * to work items of the given project.
   */
  async getProjectCoverage(projectId: string) {
    const [totalWorkItems, coveredWorkItems, totalTestCases] = await Promise.all([
      this.prisma.workItem.count({ where: { projectId } }),
      this.prisma.testCase.count({
        where: { workItem: { projectId } },
      }),
      this.prisma.testCase.count({
        where: { workItem: { projectId } },
      }),
    ])
    // coveredWorkItems here counts test cases, not distinct work items.
    // Distinct count for work items that have at least one test case:
    const workItemsWithTests = await this.prisma.workItem.count({
      where: {
        projectId,
        testCases: { some: {} },
      },
    })

    return {
      totalWorkItems,
      workItemsWithTests,
      totalTestCases,
      coveragePercent:
        totalWorkItems > 0
          ? Math.round((workItemsWithTests / totalWorkItems) * 100)
          : 0,
    }
  }
}
