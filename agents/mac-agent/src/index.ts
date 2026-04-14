import { AgentClient } from 'agent-base'
import { handleTask } from './task-handler'

const config = {
  agentId: process.env.AGENT_ID || 'mac-agent-01',
  agentType: process.env.AGENT_TYPE || 'MAC_DEV',
  orchestratorUrl: process.env.ORCHESTRATOR_WS_URL || 'ws://localhost:4001/socket/websocket',
  secret: process.env.ORCHESTRATOR_SECRET || 'local-dev-orchestrator-secret',
  heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS) || 15000,
}

console.log('╔═══════════════════════════════════════╗')
console.log('║     Mac Dev Agent — Starting...       ║')
console.log('╚═══════════════════════════════════════╝')
console.log(`  Agent ID:  ${config.agentId}`)
console.log(`  Type:      ${config.agentType}`)
console.log(`  Target:    ${config.orchestratorUrl}`)
console.log('')

const agent = new AgentClient(config, handleTask)
agent.start()

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...')
  agent.stop()
  process.exit(0)
})
process.on('SIGTERM', () => {
  agent.stop()
  process.exit(0)
})
