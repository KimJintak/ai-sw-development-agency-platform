import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { AgentTaskStatus, AgentType, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../common/redis/redis.service'
import { CreateAgentTaskDto } from './dto/create-agent-task.dto'
import { ListAgentTasksQuery } from './dto/list-agent-tasks.query'
import { TaskUpdateDto } from './dto/task-update.dto'
import { TaskCompleteDto } from './dto/task-complete.dto'

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  listCards() {
    return this.prisma.agentCard.findMany({
      orderBy: { agentType: 'asc' },
    })
  }

  async findCard(id: string) {
    const card = await this.prisma.agentCard.findUnique({ where: { id } })
    if (!card) throw new NotFoundException(`AgentCard ${id} not found`)
    return card
  }

  listTasks(q: ListAgentTasksQuery) {
    const where: Prisma.AgentTaskWhereInput = {}
    if (q.projectId) where.projectId = q.projectId
    if (q.status) where.status = q.status as AgentTaskStatus
    if (q.agentType) where.agentCard = { agentType: q.agentType as AgentType }

    return this.prisma.agentTask.findMany({
      where,
      include: {
        agentCard: { select: { id: true, agentType: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
  }

  async findTask(id: string) {
    const task = await this.prisma.agentTask.findUnique({
      where: { id },
      include: { agentCard: true },
    })
    if (!task) throw new NotFoundException(`AgentTask ${id} not found`)
    return task
  }

  async createTask(dto: CreateAgentTaskDto) {
    const card = await this.prisma.agentCard.findUnique({
      where: { agentType: dto.agentType as AgentType },
    })
    if (!card) {
      throw new NotFoundException(`AgentCard for type ${dto.agentType} not found`)
    }

    const task = await this.prisma.agentTask.create({
      data: {
        agentCardId: card.id,
        taskType: dto.taskType,
        payload: dto.payload as Prisma.InputJsonValue,
        projectId: dto.projectId,
        workItemId: dto.workItemId,
        userId: dto.userId,
        maxRetries: dto.maxRetries ?? 3,
      },
    })

    // Publish to Redis stream so the Phoenix Orchestrator's RedisConsumer
    // picks it up and dispatches to an online agent of the matching type.
    // Failure path: task row is kept in SUBMITTED state with errorLog set,
    // so a future outbox worker (Phase 3.5) can retry publish.
    try {
      await this.redis.publishTask({
        taskId: task.id,
        projectId: task.projectId!,
        agentType: dto.agentType,
        taskType: task.taskType,
        payload: dto.payload,
      })
      return task
    } catch (err) {
      const message = (err as Error).message
      this.logger.error(`Failed to publish task ${task.id} to Redis: ${message}`)
      return this.prisma.agentTask.update({
        where: { id: task.id },
        data: { errorLog: `redis_publish_failed: ${message}` },
      })
    }
  }

  async applyUpdate(id: string, dto: TaskUpdateDto) {
    await this.findTask(id)

    const data: Prisma.AgentTaskUpdateInput = {}
    if (dto.status) data.status = dto.status as AgentTaskStatus
    if (dto.status === 'WORKING') data.startedAt = new Date()

    // progress / message / payload are merged into the existing result JSON
    // so the PM UI can display in-flight telemetry without blowing away
    // earlier updates.
    if (dto.progress !== undefined || dto.message || dto.payload) {
      const existing = await this.prisma.agentTask.findUnique({
        where: { id },
        select: { result: true },
      })
      const raw = existing?.result
      const prior =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : {}
      data.result = {
        ...prior,
        ...(dto.progress !== undefined ? { progress: dto.progress } : {}),
        ...(dto.message ? { lastMessage: dto.message } : {}),
        ...(dto.payload ?? {}),
      } as Prisma.InputJsonValue
    }

    return this.prisma.agentTask.update({ where: { id }, data })
  }

  async markComplete(id: string, dto: TaskCompleteDto) {
    await this.findTask(id)

    const success = dto.success ?? true
    return this.prisma.agentTask.update({
      where: { id },
      data: {
        status: success ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED,
        result: (dto.result ?? {}) as Prisma.InputJsonValue,
        errorLog: dto.errorLog,
        completedAt: new Date(),
      },
    })
  }
}
