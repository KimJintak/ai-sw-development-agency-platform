import WebSocket from 'ws'
import type { TaskHandler, TaskPayload, TaskResult } from './types'

export interface AgentConfig {
  agentId: string
  agentType: string
  orchestratorUrl: string   // e.g. ws://localhost:4001/socket/websocket
  secret: string
  heartbeatIntervalMs?: number
}

/**
 * Base agent client that connects to the Phoenix Orchestrator via WebSocket,
 * handles heartbeat, receives tasks, and reports results.
 *
 * Phoenix Channel wire protocol (JSON):
 *   Join:    [joinRef, ref, topic, "phx_join", payload]
 *   Message: [joinRef, ref, topic, event,      payload]
 *   Reply:   [joinRef, ref, topic, "phx_reply", {status, response}]
 */
export class AgentClient {
  private ws: WebSocket | null = null
  private config: AgentConfig
  private handler: TaskHandler
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private ref = 0
  private joinRef = '1'
  private topic: string
  private connected = false

  constructor(config: AgentConfig, handler: TaskHandler) {
    this.config = config
    this.handler = handler
    this.topic = `agent:${config.agentId}`
  }

  /** Start the agent — connects and auto-reconnects */
  start(): void {
    this.connect()
  }

  /** Gracefully stop the agent */
  stop(): void {
    this.connected = false
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    console.log(`[${this.config.agentId}] Agent stopped`)
  }

  private connect(): void {
    const params = new URLSearchParams({
      agent_id: this.config.agentId,
      agent_type: this.config.agentType,
      secret: this.config.secret,
    })
    const url = `${this.config.orchestratorUrl}?${params}`

    console.log(`[${this.config.agentId}] Connecting to ${this.config.orchestratorUrl}...`)
    this.ws = new WebSocket(url)

    this.ws.on('open', () => {
      console.log(`[${this.config.agentId}] WebSocket connected, joining channel...`)
      this.joinChannel()
    })

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        this.handleMessage(msg)
      } catch (e) {
        console.error(`[${this.config.agentId}] Failed to parse message:`, e)
      }
    })

    this.ws.on('close', () => {
      console.log(`[${this.config.agentId}] WebSocket closed`)
      this.cleanup()
      this.scheduleReconnect()
    })

    this.ws.on('error', (err) => {
      console.error(`[${this.config.agentId}] WebSocket error:`, err.message)
    })
  }

  private joinChannel(): void {
    this.joinRef = String(++this.ref)
    this.send(this.joinRef, this.nextRef(), this.topic, 'phx_join', {})
  }

  private handleMessage(msg: unknown[]): void {
    // Phoenix wire format: [joinRef, ref, topic, event, payload]
    if (!Array.isArray(msg) || msg.length < 5) return
    const [, , , event, payload] = msg

    switch (event) {
      case 'phx_reply':
        this.handleReply(payload as { status: string; response: unknown })
        break
      case 'phx_error':
        console.error(`[${this.config.agentId}] Channel error:`, payload)
        break
      case 'phx_close':
        console.log(`[${this.config.agentId}] Channel closed by server`)
        break
      case 'task:dispatch':
        this.handleTaskDispatch(payload as TaskPayload)
        break
      default:
        console.log(`[${this.config.agentId}] Unknown event: ${event}`)
    }
  }

  private handleReply(payload: { status: string; response: unknown }): void {
    if (payload.status === 'ok' && !this.connected) {
      this.connected = true
      console.log(`[${this.config.agentId}] Joined channel ${this.topic} ✓`)
      this.startHeartbeat()
    } else if (payload.status === 'error') {
      console.error(`[${this.config.agentId}] Join failed:`, payload.response)
    }
  }

  private async handleTaskDispatch(raw: TaskPayload): Promise<void> {
    // The Orchestrator sends the full dispatch payload; extract task info
    const task: TaskPayload = {
      task_id: raw.task_id || (raw as any).task?.id,
      project_id: raw.project_id,
      agent_type: raw.agent_type || (raw as any).task?.agent_type,
      task_type: raw.task_type || (raw as any).task?.task_type,
      payload: raw.payload || raw,
    }

    console.log(`[${this.config.agentId}] Received task: ${task.task_id}`)

    // Report start
    this.sendTaskUpdate(task.task_id, { status: 'WORKING', progress: 0, log: 'Task started' })

    try {
      const result = await this.handler(task)

      if (result.status === 'completed') {
        this.sendTaskComplete(task.task_id, {
          status: 'COMPLETED',
          result: result.result || {},
        })
        console.log(`[${this.config.agentId}] Task ${task.task_id} completed ✓`)
      } else {
        this.sendTaskComplete(task.task_id, {
          status: 'FAILED',
          error: result.error || 'Unknown error',
        })
        console.log(`[${this.config.agentId}] Task ${task.task_id} failed: ${result.error}`)
      }
    } catch (err: any) {
      this.sendTaskComplete(task.task_id, {
        status: 'FAILED',
        error: err.message,
      })
      console.error(`[${this.config.agentId}] Task ${task.task_id} threw:`, err.message)
    }
  }

  /** Send a progress update for a task */
  sendTaskUpdate(taskId: string, payload: Record<string, unknown>): void {
    this.send(this.joinRef, this.nextRef(), this.topic, 'task:update', {
      task_id: taskId,
      ...payload,
    })
  }

  /** Send a completion message for a task */
  sendTaskComplete(taskId: string, payload: Record<string, unknown>): void {
    this.send(this.joinRef, this.nextRef(), this.topic, 'task:complete', {
      task_id: taskId,
      ...payload,
    })
  }

  private startHeartbeat(): void {
    const interval = this.config.heartbeatIntervalMs || 15000
    this.heartbeatTimer = setInterval(() => {
      // Phoenix heartbeat: topic = "phoenix", event = "heartbeat"
      this.send(null, this.nextRef(), 'phoenix', 'heartbeat', {})
      // Also channel-level heartbeat
      this.send(this.joinRef, this.nextRef(), this.topic, 'heartbeat', {})
    }, interval)
  }

  private send(joinRef: string | null, ref: string, topic: string, event: string, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify([joinRef, ref, topic, event, payload]))
    }
  }

  private nextRef(): string {
    return String(++this.ref)
  }

  private cleanup(): void {
    this.connected = false
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    console.log(`[${this.config.agentId}] Reconnecting in 5s...`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 5000)
  }
}
