import {
  generateText,
  hasAnyLlmKey,
  modelFor,
  modelIdFor,
  type TaskPayload,
  type TaskResult,
} from 'agent-base'

/**
 * Mac Dev Agent task handler.
 * Receives a task from the Orchestrator, uses the configured LLM to generate
 * code, and returns the result.
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
        return await handleCodeTask(task)
    }
  } catch (err: any) {
    return { status: 'failed', error: err.message }
  }
}

async function handleCodeTask(task: TaskPayload): Promise<TaskResult> {
  const p = task.payload
  const prompt = buildCodePrompt(p)

  if (!hasAnyLlmKey()) {
    console.log('[task-handler] No LLM provider key set — running in dry-run mode')
    return {
      status: 'completed',
      result: {
        mode: 'dry-run',
        prompt_preview: prompt.slice(0, 500),
        message:
          'No LLM provider key configured. Set ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY / OPENROUTER_API_KEY to enable AI code generation.',
      },
    }
  }

  const modelId = modelIdFor('code')
  console.log(`[task-handler] Calling LLM (${modelId}) ...`)
  const { text, usage } = await generateText({
    model: modelFor('code'),
    system: buildSystemPrompt(task),
    prompt,
    maxOutputTokens: 4096,
  })

  return {
    status: 'completed',
    result: {
      generated_code: text,
      model: modelId,
      usage: {
        input_tokens: usage.inputTokens ?? 0,
        output_tokens: usage.outputTokens ?? 0,
      },
    },
  }
}

async function handleTestGeneration(task: TaskPayload): Promise<TaskResult> {
  const p = task.payload
  const prompt = `Generate test cases for the following:\n\nTitle: ${p.title || 'Unknown'}\nDescription: ${p.description || ''}\nPlatform: ${p.platform || 'macOS/iOS'}\nLanguage: ${p.language || 'Swift'}\n\nWrite comprehensive unit tests using XCTest framework.`

  if (!hasAnyLlmKey()) {
    return {
      status: 'completed',
      result: { mode: 'dry-run', prompt_preview: prompt.slice(0, 300) },
    }
  }

  const modelId = modelIdFor('test')
  const { text } = await generateText({
    model: modelFor('test'),
    system: 'You are an expert iOS/macOS test engineer. Generate comprehensive XCTest test cases.',
    prompt,
    maxOutputTokens: 4096,
  })

  return {
    status: 'completed',
    result: { generated_tests: text, model: modelId },
  }
}

async function handleBuild(task: TaskPayload): Promise<TaskResult> {
  const p = task.payload
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
