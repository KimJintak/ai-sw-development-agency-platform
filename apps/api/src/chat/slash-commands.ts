export interface ParsedTaskCommand {
  agentType: string
  taskType: string
  ref?: string
}

/**
 * Parses `/task @AGENT_TYPE task_type [REQ-123|WI-456]` chat commands.
 * Returns null if body doesn't match the expected shape.
 *
 * Examples:
 *   /task @MAC_DEV code_generation REQ-001
 *   /task @BACKEND bug_fix BUG-42
 *   /task @MAC_DEV build
 */
export function parseTaskCommand(body: string): ParsedTaskCommand | null {
  const trimmed = body.trim()
  if (!trimmed.startsWith('/task')) return null
  const rest = trimmed.slice('/task'.length).trim()
  const m = rest.match(/^@(\w+)\s+(\w+)(?:\s+(\S+))?/)
  if (!m) return null
  const [, agentType, taskType, ref] = m
  return { agentType: agentType.toUpperCase(), taskType, ref }
}
