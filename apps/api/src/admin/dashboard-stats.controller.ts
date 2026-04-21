import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service'

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard/stats')
export class DashboardStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '대시보드 종합 통계' })
  async stats() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalProjects,
      activeProjects,
      totalAgents,
      onlineAgents,
      unreadFeedback,
      p0p1Feedback,
      weekReleases,
      pendingApprovals,
      weekTasks,
      recentFeedback,
      recentReleases,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.agentCard.count(),
      this.prisma.agentCard.count({ where: { status: 'ONLINE' } }),
      this.prisma.feedback.count({ where: { status: { in: ['NEW', 'TRIAGED'] } } }),
      this.prisma.feedback.count({ where: { severity: { in: ['P0', 'P1'] }, status: { not: 'RESOLVED' } } }),
      this.prisma.release.count({ where: { status: 'DEPLOYED', deployedAt: { gte: weekAgo } } }),
      this.prisma.requirement.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.agentTask.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.feedback.findMany({
        where: { createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, title: true, severity: true, type: true, status: true,
          createdAt: true, workItemId: true,
          project: { select: { id: true, name: true } },
        },
      }),
      this.prisma.release.findMany({
        where: { status: 'DEPLOYED' },
        orderBy: { deployedAt: 'desc' },
        take: 5,
        select: {
          id: true, version: true, deployedAt: true, platforms: true,
          project: { select: { id: true, name: true } },
        },
      }),
    ])

    return {
      projects: { total: totalProjects, active: activeProjects },
      agents: { total: totalAgents, online: onlineAgents },
      feedback: { unresolved: unreadFeedback, criticalOpen: p0p1Feedback },
      releases: { thisWeek: weekReleases },
      requirements: { pendingApproval: pendingApprovals },
      tasks: { thisWeek: weekTasks },
      recentFeedback,
      recentReleases,
    }
  }
}
