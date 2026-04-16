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

  async stalledTasks(thresholdMinutes = 15) {
    const tasks = await this.prisma.agentTask.findMany({
      where: {
        status: { in: [AgentTaskStatus.SUBMITTED, AgentTaskStatus.WORKING] },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        agentCard: { select: { agentType: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })

    if (tasks.length === 0) return []

    const now = Date.now()
    const cutoffMs = thresholdMinutes * 60 * 1000

    const enriched = await Promise.all(
      tasks.map(async (task) => {
        const lastUpdate = await this.prisma.chatMessage.findFirst({
          where: {
            projectId: task.projectId ?? undefined,
            kind: ChatMessageKind.AGENT_UPDATE,
            metadata: { path: ['taskId'], equals: task.id },
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, body: true },
        })

        const lastActivityAt = lastUpdate?.createdAt ?? task.startedAt ?? task.createdAt
        const idleMs = now - lastActivityAt.getTime()
        const progress = this.extractProgress(task.result)

        return {
          ...task,
          lastActivityAt,
          lastUpdateBody: lastUpdate?.body ?? null,
          idleMinutes: Math.round(idleMs / 60_000),
          progress,
          stalled: idleMs > cutoffMs,
        }
      }),
    )

    return enriched
      .filter((t) => t.stalled)
      .sort((a, b) => b.idleMinutes - a.idleMinutes)
      .slice(0, 50)
  }

  private extractProgress(result: unknown): number | null {
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      const r = result as Record<string, unknown>
      if (typeof r.progress === 'number') return r.progress
    }
    return null
  }
}
