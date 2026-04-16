import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  async myProjects(customerId: string) {
    return this.prisma.project.findMany({
      where: { customerId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      select: {
        id: true,
        name: true,
        status: true,
        platforms: true,
        createdAt: true,
        _count: {
          select: { workItems: true, releases: true, requirements: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async projectProgress(customerId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workItems: { select: { status: true } },
        releases: {
          where: { status: { in: ['DEPLOYED', 'DEPLOYING'] } },
          orderBy: { deployedAt: 'desc' },
          take: 5,
          select: { id: true, version: true, status: true, deployedAt: true, platforms: true },
        },
      },
    })
    if (!project) throw new NotFoundException('Project not found')
    if (project.customerId !== customerId) throw new ForbiddenException()

    const total = project.workItems.length
    const done = project.workItems.filter((w) => w.status === 'DONE').length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0

    return {
      projectId: project.id,
      name: project.name,
      status: project.status,
      platforms: project.platforms,
      progress,
      workItemStats: { total, done, inProgress: project.workItems.filter((w) => w.status === 'IN_PROGRESS').length },
      recentReleases: project.releases,
    }
  }

  async projectBuilds(customerId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundException('Project not found')
    if (project.customerId !== customerId) throw new ForbiddenException()

    return this.prisma.build.findMany({
      where: { release: { projectId }, status: 'SUCCESS' },
      include: { release: { select: { version: true } } },
      orderBy: { completedAt: 'desc' },
      take: 20,
    })
  }

  async projectRequirements(customerId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundException('Project not found')
    if (project.customerId !== customerId) throw new ForbiddenException()

    return this.prisma.requirement.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        version: true,
        platforms: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async approveRequirement(customerId: string, requirementId: string) {
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: { select: { customerId: true } } },
    })
    if (!req) throw new NotFoundException('Requirement not found')
    if (req.project.customerId !== customerId) throw new ForbiddenException()
    return this.prisma.requirement.update({
      where: { id: requirementId },
      data: { status: 'APPROVED' },
    })
  }

  async rejectRequirement(customerId: string, requirementId: string, reason?: string) {
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: { select: { customerId: true } } },
    })
    if (!req) throw new NotFoundException('Requirement not found')
    if (req.project.customerId !== customerId) throw new ForbiddenException()
    return this.prisma.requirement.update({
      where: { id: requirementId },
      data: { status: 'REJECTED' },
    })
  }

  async deliveryReport(customerId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workItems: { select: { id: true, title: true, status: true, type: true } },
        releases: {
          include: { builds: { where: { status: 'SUCCESS' } } },
          orderBy: { createdAt: 'desc' },
        },
        requirements: { select: { id: true, title: true, status: true, version: true } },
      },
    })
    if (!project) throw new NotFoundException('Project not found')
    if (project.customerId !== customerId) throw new ForbiddenException()

    const testRuns = await this.prisma.testRun.findMany({
      where: { release: { projectId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const total = project.workItems.length
    const done = project.workItems.filter((w) => w.status === 'DONE').length

    return {
      project: { id: project.id, name: project.name, status: project.status, platforms: project.platforms },
      summary: {
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        totalWorkItems: total,
        completedWorkItems: done,
        totalRequirements: project.requirements.length,
        approvedRequirements: project.requirements.filter((r) => r.status === 'APPROVED').length,
        totalReleases: project.releases.length,
        deployedReleases: project.releases.filter((r) => r.status === 'DEPLOYED').length,
        totalBuilds: project.releases.reduce((sum, r) => sum + r.builds.length, 0),
      },
      requirements: project.requirements,
      releases: project.releases.map((r) => ({
        id: r.id,
        version: r.version,
        status: r.status,
        deployedAt: r.deployedAt,
        buildCount: r.builds.length,
      })),
      testRuns: testRuns.map((t) => ({
        id: t.id,
        status: t.status,
        createdAt: t.createdAt,
      })),
      generatedAt: new Date().toISOString(),
    }
  }
}
