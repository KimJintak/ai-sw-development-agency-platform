/** Payload received when Orchestrator dispatches a task */
export interface TaskPayload {
  task_id: string
  project_id: string
  agent_type: string
  task_type?: string
  /**
   * Correlation ID to trace a single logical request across API →
   * Orchestrator → Agent → callback. Defaults to the task_id when the
   * upstream caller does not supply one.
   */
  correlation_id?: string
  payload: Record<string, unknown>
}

/** Result the handler returns after completing a task */
export interface TaskResult {
  status: 'completed' | 'failed'
  result?: Record<string, unknown>
  error?: string
}

/** Handler function that agents implement to process tasks */
export type TaskHandler = (task: TaskPayload) => Promise<TaskResult>
