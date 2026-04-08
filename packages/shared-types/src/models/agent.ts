import { AgentStatus, AgentTaskStatus, AgentType } from './enums'

export interface AgentCard {
  id: string
  agentType: AgentType
  name: string
  description?: string
  endpoint: string
  skills: AgentSkill[]
  status: AgentStatus
  lastSeenAt?: string
  createdAt: string
  updatedAt: string
}

export interface AgentSkill {
  id: string
  name: string
  description?: string
  inputSchema: Record<string, unknown>
}

export interface AgentTask {
  id: string
  agentCardId: string
  workItemId?: string
  projectId?: string
  taskType: string
  payload: Record<string, unknown>
  status: AgentTaskStatus
  retryCount: number
  maxRetries: number
  result?: Record<string, unknown>
  errorLog?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// A2A 프로토콜 메시지 타입
export interface A2ATaskMessage {
  jsonrpc: '2.0'
  id: string
  method: 'tasks/create'
  params: {
    taskId: string
    projectId: string
    workItemId?: string
    skillId: string
    payload: Record<string, unknown>
    retryPolicy: {
      maxRetries: number
      backoffMs: number
    }
  }
}

export interface A2AStatusMessage {
  jsonrpc: '2.0'
  method: 'tasks/status'
  params: {
    taskId: string
    status: AgentTaskStatus
    progress?: number
    log?: string
    result?: Record<string, unknown>
    error?: string
  }
}
