import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

export const ORCHESTRATOR_STREAM_KEY = 'orchestrator:tasks'

/**
 * Wire format consumed by `Orchestrator.RedisConsumer`:
 *
 *   top-level stream fields: `project_id`, `payload`
 *   `payload` is a JSON-encoded map containing at minimum
 *   `task_id`, `agent_type`, `task_type`, plus any user-supplied fields.
 *
 * The Orchestrator's ProjectOrchestrator dispatches to an agent using
 * these fields — they MUST live inside `payload`, not as top-level
 * stream fields, because the consumer only decodes `payload`.
 */
export interface OrchestratorTaskEntry {
  taskId: string
  projectId: string
  agentType: string
  taskType: string
  payload: Record<string, unknown>
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client!: Redis

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'
    this.client = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 3 })
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`))
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit()
  }

  /**
   * Publishes an orchestrator task entry to the Redis stream consumed by
   * the Phoenix Orchestrator (`orchestrator:tasks`). The Orchestrator's
   * RedisConsumer reads via XREADGROUP and dispatches to an agent.
   */
  async publishTask(entry: OrchestratorTaskEntry): Promise<string> {
    // Fold routing fields into the payload JSON — the Orchestrator's
    // RedisConsumer decodes `payload` and passes the map straight to
    // ProjectOrchestrator.enqueue_task/2, so `task_id`/`agent_type`/
    // `task_type` must live there for dispatcher routing.
    const innerPayload = {
      task_id: entry.taskId,
      agent_type: entry.agentType,
      task_type: entry.taskType,
      ...entry.payload,
    }

    const fields: string[] = [
      'project_id', entry.projectId,
      'task_id', entry.taskId,
      'payload', JSON.stringify(innerPayload),
    ]

    const id = await this.client.xadd(ORCHESTRATOR_STREAM_KEY, '*', ...fields)
    this.logger.debug(`XADD ${ORCHESTRATOR_STREAM_KEY} -> ${id} (task=${entry.taskId})`)
    return id ?? ''
  }
}
