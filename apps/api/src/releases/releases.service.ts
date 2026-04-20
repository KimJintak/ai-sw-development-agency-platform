import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BuildStatus, Platform, Prisma, ReleaseStatus } from '@prisma/client'

@Injectable()
export class ReleasesService {
  constructor(private readonly prisma: PrismaService) {}

  listByProject(projectId: string) {
    return this.prisma.release.findMany({
      where: { projectId },
      include: {
        _count: { select: { releaseItems: true, builds: true, testRuns: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const release = await this.prisma.release.findUnique({
      where: { id },
      include: {
        releaseItems: { include: { workItem: { select: { id: true, title: true, status: true, type: true } } } },
        builds: { orderBy: { createdAt: 'desc' } },
        testRuns: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    if (!release) throw new NotFoundException(`Release ${id} not found`)
    return release
  }

  create(input: { projectId: string; version: string; title?: string; platforms: Platform[] }) {
    return this.prisma.release.create({
      data: {
        projectId: input.projectId,
        version: input.version,
        title: input.title,
        platforms: input.platforms,
      },
    })
  }

  async addWorkItems(releaseId: string, workItemIds: string[]) {
    await this.findOne(releaseId)
    const data = workItemIds.map((wid) => ({ releaseId, workItemId: wid }))
    return this.prisma.releaseItem.createMany({ data, skipDuplicates: true })
  }

  async removeWorkItem(releaseId: string, workItemId: string) {
    return this.prisma.releaseItem.delete({
      where: { releaseId_workItemId: { releaseId, workItemId } },
    })
  }

  async transition(releaseId: string, nextStatus: ReleaseStatus) {
    const release = await this.findOne(releaseId)
    const allowed = this.allowedTransitions(release.status)
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${release.status} to ${nextStatus}. Allowed: ${allowed.join(', ')}`,
      )
    }
    const data: Prisma.ReleaseUpdateInput = { status: nextStatus }
    if (nextStatus === ReleaseStatus.APPROVED) data.approvedAt = new Date()
    if (nextStatus === ReleaseStatus.DEPLOYED) data.deployedAt = new Date()
    return this.prisma.release.update({ where: { id: releaseId }, data })
  }

  async approve(releaseId: string) {
    const release = await this.findOne(releaseId)
    const failedTests = release.testRuns.filter((r) => r.status !== 'COMPLETED')
    if (failedTests.length > 0) {
      throw new BadRequestException(
        `Cannot approve: ${failedTests.length} test run(s) not completed. Run all tests first.`,
      )
    }
    return this.transition(releaseId, ReleaseStatus.APPROVED)
  }

  async triggerBuild(releaseId: string, platform: Platform) {
    const release = await this.findOne(releaseId)
    if (release.status !== ReleaseStatus.APPROVED && release.status !== ReleaseStatus.DEPLOYING) {
      throw new BadRequestException(`Release must be APPROVED before building. Current: ${release.status}`)
    }
    return this.prisma.build.create({
      data: { releaseId, platform, status: BuildStatus.PENDING },
    })
  }

  async updateBuild(
    buildId: string,
    input: { status?: BuildStatus; buildLog?: string; s3Key?: string; cloudfrontUrl?: string },
  ) {
    const build = await this.prisma.build.findUnique({ where: { id: buildId } })
    if (!build) throw new NotFoundException(`Build ${buildId} not found`)
    const data: Prisma.BuildUpdateInput = {}
    if (input.status) {
      data.status = input.status
      if (input.status === BuildStatus.BUILDING) data.startedAt = new Date()
      if (input.status === BuildStatus.SUCCESS || input.status === BuildStatus.FAILED) {
        data.completedAt = new Date()
      }
    }
    if (input.buildLog) data.buildLog = input.buildLog
    if (input.s3Key) data.s3Key = input.s3Key
    if (input.cloudfrontUrl) data.cloudfrontUrl = input.cloudfrontUrl
    return this.prisma.build.update({ where: { id: buildId }, data })
  }

  async attachPr(releaseId: string, prNumber: number) {
    const release = await this.findOne(releaseId)
    const next = Array.from(new Set([...release.prNumbers, prNumber])).sort((a, b) => a - b)
    return this.prisma.release.update({
      where: { id: releaseId },
      data: { prNumbers: { set: next } },
    })
  }

  async detachPr(releaseId: string, prNumber: number) {
    const release = await this.findOne(releaseId)
    const next = release.prNumbers.filter((n) => n !== prNumber)
    return this.prisma.release.update({
      where: { id: releaseId },
      data: { prNumbers: { set: next } },
    })
  }

  async deployHistory(projectId: string) {
    return this.prisma.build.findMany({
      where: { release: { projectId }, status: BuildStatus.SUCCESS },
      include: { release: { select: { id: true, version: true, title: true } } },
      orderBy: { completedAt: 'desc' },
      take: 50,
    })
  }

  private allowedTransitions(from: ReleaseStatus): ReleaseStatus[] {
    const map: Record<ReleaseStatus, ReleaseStatus[]> = {
      DRAFT: [ReleaseStatus.TESTING],
      TESTING: [ReleaseStatus.APPROVED, ReleaseStatus.DRAFT],
      APPROVED: [ReleaseStatus.DEPLOYING],
      DEPLOYING: [ReleaseStatus.DEPLOYED, ReleaseStatus.ROLLED_BACK],
      DEPLOYED: [ReleaseStatus.ROLLED_BACK],
      ROLLED_BACK: [ReleaseStatus.DRAFT],
    }
    return map[from] ?? []
  }
}
