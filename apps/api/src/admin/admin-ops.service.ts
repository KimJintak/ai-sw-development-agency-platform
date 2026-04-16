import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AgentTaskStatus, ChatMessageKind, Prisma } from '@prisma/client'

export interface OpsFeedQuery {
  limit?: number
  before?: Date
  projectId?: string
  kind?: ChatMessageKind
  q?: string
}

@Injectable()
export class AdminOpsService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(query: OpsFeedQuery) {
    const limit = Math.min(query.limit ?? 100, 500)
    const where: Prisma.ChatMessageWhereInput = {
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.before ? { createdAt: { lt: query.before } } : {}),
      ...(query.q ? { body: { contains: query.q, mode: 'insensitive' } } : {}),
    }
    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { project: { select: { id: true, name: true } } },
    })
    return messages
  }

  async summary() {
    const [projectCount, messageCount24h, activeTaskCount] = await Promise.all([
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.chatMessage.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
      }),
      this.prisma.agentTask.count({
        where: { status: { in: [AgentTaskStatus.SUBMITTED, AgentTaskStatus.WORKING] } },
      }),
    ])
    return { projectCount, messageCount24h, activeTaskCount }
  }

  /**
   * Tasks that were dispatched (SUBMITTED or WORKING) more than
   * `thresholdMinutes` ago without a completion. Used as "지연 레이더"
   * stub — a richer version (idle since last AGENT_UPDATE) arrives later.
   */
  async stalledTasks(thresholdMinutes = 15) {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000)
    return this.prisma.agentTask.findMany({
      where: {
        status: { in: [AgentTaskStatus.SUBMITTED, AgentTaskStatus.WORKING] },
        createdAt: { lt: cutoff },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        agentCard: { select: { agentType: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })
  }
}
