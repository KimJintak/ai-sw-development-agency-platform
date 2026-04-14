import Anthropic from '@anthropic-ai/sdk'
import type { TaskPayload, TaskResult } from 'agent-base'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'

/**
 * Mac Dev Agent task handler.
 * Receives a task from the Orchestrator, uses Claude to generate code,
 * and returns the result.
 */
export async function handleTask(task: TaskPayload): Promise<TaskResult> {
  const { task_type, payload } = task

  console.log(`[task-handler] Processing task type: ${task_type || 'code_generation'}`)
  console.log(`[task-handler] Payload:`, JSON.stringify(payload, null, 2))

  try {
    switch (task_type) {
      case 'code_generation':
      case 'code_review':
      case 'bug_fix':
        return await handleCodeTask(task)

      case 'test_generation':
        return await handleTestGeneration(task)

      case 'build':
        return await handleBuild(task)

      default:
        // Default: treat as a code generation task
        return await handleCodeTask(task)
    }
  } catch (err: any) {
    return { status: 'failed', error: err.message }
  }
}

async function handleCodeTask(task: TaskPayload): Promise<TaskResult> {
  const p = task.payload
  const prompt = buildCodePrompt(p)

  if (!process.env.ANTHROPIC_API_KEY) {
    // Dry-run mode when no API key is set
    console.log('[task-handler] No ANTHROPIC_API_KEY set — running in dry-run mode')
    return {
      status: 'completed',
      result: {
        mode: 'dry-run',
        prompt_preview: prompt.slice(0, 500),
        message: 'Claude API key not configured. Set ANTHROPIC_API_KEY to enable AI code generation.',
      },
    }
  }

  console.log('[task-handler] Calling Claude API...')
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
    system: buildSystemPrompt(task),
  })

  const content = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n')

  return {
    status: 'completed',
    result: {
      generated_code: content,
      model: MODEL,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    },
  }
}

async function handleTestGeneration(task: TaskPayload): Promise<TaskResult> {
  const p = task.payload
  const prompt = `Generate test cases for the following:\n\nTitle: ${p.title || 'Unknown'}\nDescription: ${p.description || ''}\nPlatform: ${p.platform || 'macOS/iOS'}\nLanguage: ${p.language || 'Swift'}\n\nWrite comprehensive unit tests using XCTest framework.`

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      status: 'completed',
      result: { mode: 'dry-run', prompt_preview: prompt.slice(0, 300) },
    }
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
    system: 'You are an expert iOS/macOS test engineer. Generate comprehensive XCTest test cases.',
  })

  const content = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n')

  return {
    status: 'completed',
    result: { generated_tests: content, model: MODEL },
  }
}

async function handleBuild(task: TaskPayload): Promise<TaskResult> {
  const p = task.payload
  // In production, this would invoke xcodebuild / flutter build
  console.log(`[task-handler] Build requested for: ${p.target || 'iOS'}`)

  return {
    status: 'completed',
    result: {
      message: 'Build simulation completed (actual xcodebuild integration pending)',
      target: p.target || 'iOS',
    },
  }
}

function buildSystemPrompt(task: TaskPayload): string {
  return `You are a senior macOS/iOS developer working on project ${task.project_id}.
Your specialties: Swift, SwiftUI, UIKit, Xcode, Flutter (iOS/macOS).
Generate clean, production-ready code with proper error handling.
Include brief inline comments for complex logic.
Follow Apple's Human Interface Guidelines for any UI code.`
}

function buildCodePrompt(payload: Record<string, unknown>): string {
  const parts: string[] = []

  if (payload.title) parts.push(`## Task: ${payload.title}`)
  if (payload.description) parts.push(`## Description:\n${payload.description}`)
  if (payload.feature_file) parts.push(`## Feature Spec:\n${payload.feature_file}`)
  if (payload.language) parts.push(`## Language: ${payload.language}`)
  if (payload.framework) parts.push(`## Framework: ${payload.framework}`)
  if (payload.platform) parts.push(`## Target Platform: ${payload.platform}`)

  if (parts.length === 0) {
    parts.push('Generate a Swift code snippet based on the task context.')
  }

  parts.push('\nPlease generate the implementation code.')
  return parts.join('\n\n')
}
