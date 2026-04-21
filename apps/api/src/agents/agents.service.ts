import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common'
import { AgentTaskStatus, AgentType, ChatMessageKind, NotificationType, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../common/redis/redis.service'
import { CreateAgentTaskDto } from './dto/create-agent-task.dto'
import { ListAgentTasksQuery } from './dto/list-agent-tasks.query'
import { TaskUpdateDto } from './dto/task-update.dto'
import { TaskCompleteDto } from './dto/task-complete.dto'
import { ChatService } from '../chat/chat.service'
import { ChatGateway } from '../chat/chat.gateway'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(forwardRef(() => ChatService))
    private readonly chat: ChatService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly notifications: NotificationsService,
  ) {}

  private async postChatStatus(taskId: string, body: string, kind: ChatMessageKind) {
    try {
      const task = await this.prisma.agentTask.findUnique({
        where: { id: taskId },
        select: {
          projectId: true,
          agentCard: { select: { id: true, name: true, agentType: true } },
        },
      })
      if (!task?.projectId || !task.agentCard) return
      const msg = await this.chat.postAgent(
        task.projectId,
        { id: task.agentCard.id, name: `${task.agentCard.agentType} 에이전트` },
        { body, kind, metadata: { taskId } },
      )
      this.chatGateway.broadcastMessage(task.projectId, msg)
    } catch (err) {
      this.logger.warn(`chat bot post failed for task ${taskId}: ${(err as Error).message}`)
    }
  }

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
    //
    // correlation_id = task.id by default — gives us one traceable key that
    // flows through Redis → Orchestrator → Agent → callback. When the API
    // caller eventually wires request-scoped cids, they can override by
    // supplying `correlation_id` inside dto.payload.
    const correlationId =
      (dto.payload as Record<string, unknown> | undefined)?.correlation_id as string | undefined ??
      task.id
    try {
      await this.redis.publishTask({
        taskId: task.id,
        projectId: task.projectId!,
        agentType: dto.agentType,
        taskType: task.taskType,
        payload: { ...dto.payload, correlation_id: correlationId },
      })
      this.logger.log(`task.created task_id=${task.id} cid=${correlationId}`)
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

  /**
   * Atomic read-merge-write of the AgentTask row. Earlier versions
   * were split into two queries which lost telemetry under concurrent
   * updates from the Orchestrator. We now wrap the read + merge + write
   * in a single $transaction with Serializable isolation so concurrent
   * callers are serialized at the DB layer; if a conflict occurs Prisma
   * surfaces P2034 and the Orchestrator retries via its own outbox.
   */
  async applyUpdate(id: string, dto: TaskUpdateDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.agentTask.findUnique({
          where: { id },
          select: { result: true, status: true },
        })
        if (!existing) throw new NotFoundException(`AgentTask ${id} not found`)

        const data: Prisma.AgentTaskUpdateInput = {}
        if (dto.status) data.status = dto.status as AgentTaskStatus
        if (dto.status === 'WORKING' && existing.status !== 'WORKING') {
          data.startedAt = new Date()
        }

        if (dto.progress !== undefined || dto.message || dto.payload) {
          const raw = existing.result
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

        return tx.agentTask.update({ where: { id }, data })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
    .then(async (updated) => {
      if (dto.message || dto.progress !== undefined) {
        const pct = dto.progress !== undefined ? ` (${Math.round(dto.progress * 100)}%)` : ''
        await this.postChatStatus(
          id,
          `${dto.message ?? '진행 중...'}${pct}`,
          ChatMessageKind.AGENT_UPDATE,
        )
      }
      return updated
    })
  }

  async markComplete(id: string, dto: TaskCompleteDto) {
    await this.findTask(id)

    const success = dto.success ?? true
    const updated = await this.prisma.agentTask.update({
      where: { id },
      data: {
        status: success ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED,
        result: (dto.result ?? {}) as Prisma.InputJsonValue,
        errorLog: dto.errorLog,
        completedAt: new Date(),
      },
    })

    await this.postChatStatus(
      id,
      success
        ? `태스크 완료 ✓${dto.errorLog ? ` — ${dto.errorLog}` : ''}`
        : `태스크 실패 ✗${dto.errorLog ? ` — ${dto.errorLog}` : ''}`,
      ChatMessageKind.STATUS,
    )

    if (success) {
      await this.notifyProjectMembers(updated.projectId, id, updated.taskType)
    }

    return updated
  }

  private async notifyProjectMembers(projectId: string | null, taskId: string, taskTitle: string) {
    if (!projectId) return
    try {
      const members = await this.prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      })
      await Promise.all(
        members.map((m) =>
          this.notifications.create(
            m.userId,
            NotificationType.AGENT_TASK_DONE,
            '에이전트 태스크 완료',
            taskTitle,
            `/projects/${projectId}/wbs`,
          ),
        ),
      )
    } catch (err) {
      this.logger.warn(`notification failed for task ${taskId}: ${(err as Error).message}`)
    }
  }
}
