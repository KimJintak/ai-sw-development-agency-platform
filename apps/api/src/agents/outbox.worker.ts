import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { AgentTaskStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../common/redis/redis.service'

/**
 * Phase 3.5 outbox worker.
 *
 * `AgentsService.createTask` marks the `errorLog` column with
 * `redis_publish_failed: ...` when the initial XADD fails. This worker
 * sweeps SUBMITTED tasks whose errorLog starts with that prefix and
 * retries the publish on a fixed interval. Successful retries clear
 * `errorLog`.
 *
 * Not a durable outbox (no dedicated table) — suitable for transient
 * Redis outages. A full outbox table lands in Phase 6.
 */
@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorker.name)
  private readonly intervalMs = Number(process.env.OUTBOX_INTERVAL_MS ?? 15_000)
  private readonly batchSize = Number(process.env.OUTBOX_BATCH_SIZE ?? 25)
  private readonly enabled =
    (process.env.OUTBOX_WORKER_ENABLED ?? 'true').toLowerCase() !== 'false'
  private timer: NodeJS.Timeout | null = null
  private running = false

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('OutboxWorker disabled via OUTBOX_WORKER_ENABLED=false')
      return
    }
    this.timer = setInterval(() => void this.sweep(), this.intervalMs)
    this.logger.log(`OutboxWorker started (interval=${this.intervalMs}ms, batch=${this.batchSize})`)
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }

  /** Exposed for tests. */
  async sweep() {
    if (this.running) return
    this.running = true
    try {
      const candidates = await this.prisma.agentTask.findMany({
        where: {
          status: AgentTaskStatus.SUBMITTED,
          errorLog: { startsWith: 'redis_publish_failed' },
        },
        include: {
          agentCard: { select: { agentType: true } },
        },
        take: this.batchSize,
        orderBy: { createdAt: 'asc' },
      })

      if (candidates.length === 0) return
      this.logger.debug(`OutboxWorker: retrying ${candidates.length} task(s)`)

      for (const task of candidates) {
        if (!task.projectId) {
          // Without projectId the Orchestrator can't route; skip and
          // leave errorLog intact so an operator can inspect.
          continue
        }
        try {
          await this.redis.publishTask({
            taskId: task.id,
            projectId: task.projectId,
            agentType: task.agentCard.agentType,
            taskType: task.taskType,
            payload: (task.payload ?? {}) as Record<string, unknown>,
          })
          await this.prisma.agentTask.update({
            where: { id: task.id },
            data: { errorLog: null },
          })
          this.logger.log(`OutboxWorker: re-published task ${task.id}`)
        } catch (err) {
          this.logger.warn(
            `OutboxWorker: retry failed for task ${task.id}: ${(err as Error).message}`,
          )
        }
      }
    } finally {
      this.running = false
    }
  }
}
