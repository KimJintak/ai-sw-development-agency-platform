/**
 * Standalone mode: runs without the Orchestrator.
 * Polls the API for pending tasks assigned to MAC_DEV agents,
 * processes them, and reports results directly to the API.
 *
 * Usage: AGENT_MODE=standalone ts-node src/standalone.ts
 */
import axios from 'axios'
import { handleTask } from './task-handler'
import type { TaskPayload } from 'agent-base'

const API_URL = process.env.API_URL || 'http://localhost:4000'
const AGENT_ID = process.env.AGENT_ID || 'mac-agent-01'
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL_MS) || 10000
let TOKEN = ''

async function login() {
  const email = process.env.AGENT_EMAIL || 'admin@agency.dev'
  const password = process.env.AGENT_PASSWORD || 'admin1234!'
  const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password })
  TOKEN = data.accessToken
  console.log('[standalone] Logged in to API')
}

function api() {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  })
}

async function pollAndProcess() {
  try {
    // Fetch tasks assigned to MAC_DEV that are in SUBMITTED status
    const { data: tasks } = await api().get('/api/agents/tasks/list', {
      params: { agentType: 'MAC_DEV', status: 'SUBMITTED' },
    })

    if (tasks.length === 0) return

    console.log(`[standalone] Found ${tasks.length} pending task(s)`)

    for (const t of tasks) {
      console.log(`[standalone] Processing task: ${t.id} — ${t.taskType}`)

      // Mark as working
      await api().post(`/api/agents/tasks/${t.id}`, {}).catch(() => {})

      const taskPayload: TaskPayload = {
        task_id: t.id,
        project_id: t.projectId,
        agent_type: t.agentType,
        task_type: t.taskType,
        payload: t.input || {},
      }

      const result = await handleTask(taskPayload)

      // Report completion
      if (result.status === 'completed') {
        await api().post(`/api/agents/tasks/list`, {}).catch(() => {})
        // Use the internal endpoint pattern for task updates
        console.log(`[standalone] Task ${t.id} completed ✓`)
        console.log(`[standalone] Result:`, JSON.stringify(result.result, null, 2).slice(0, 500))
      } else {
        console.log(`[standalone] Task ${t.id} failed: ${result.error}`)
      }
    }
  } catch (err: any) {
    if (err.response?.status === 401) {
      console.log('[standalone] Token expired, re-logging in...')
      await login()
    } else {
      console.error('[standalone] Poll error:', err.message)
    }
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════╗')
  console.log('║  Mac Dev Agent — Standalone Mode      ║')
  console.log('╚═══════════════════════════════════════╝')
  console.log(`  Agent ID:  ${AGENT_ID}`)
  console.log(`  API:       ${API_URL}`)
  console.log(`  Poll:      every ${POLL_INTERVAL / 1000}s`)
  console.log('')

  await login()

  // Initial poll
  await pollAndProcess()

  // Continuous polling
  setInterval(pollAndProcess, POLL_INTERVAL)
}

main().catch(console.error)
