import { anthropic } from '@ai-sdk/anthropic'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

export type LlmTask = 'default' | 'pm' | 'triage' | 'summarize' | 'code' | 'test'

export const DEFAULT_MODEL_ID = 'anthropic:claude-sonnet-4-5'

export function hasAnyLlmKey(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.OPENROUTER_API_KEY,
  )
}

/** Look up the raw model id string configured for a task (e.g. "anthropic:claude-sonnet-4-5"). */
export function modelIdFor(task: LlmTask = 'default'): string {
  const taskKey = `LLM_MODEL_${task.toUpperCase()}`
  return process.env[taskKey] ?? process.env.LLM_MODEL_DEFAULT ?? DEFAULT_MODEL_ID
}

/** Resolve the model for a task, honoring `LLM_MODEL_<TASK>` with fallback to `LLM_MODEL_DEFAULT`. */
export function modelFor(task: LlmTask = 'default'): LanguageModel {
  return resolveModel(modelIdFor(task))
}

/** Parse "<provider>:<modelId>" and return the configured LanguageModel. */
export function resolveModel(id: string): LanguageModel {
  const sepIndex = id.indexOf(':')
  if (sepIndex <= 0) {
    throw new Error(`Invalid LLM model id "${id}" — expected "<provider>:<modelId>"`)
  }
  const provider = id.slice(0, sepIndex)
  const modelId = id.slice(sepIndex + 1)

  switch (provider) {
    case 'anthropic':
      return anthropic(modelId)
    case 'openai':
      return openai(modelId)
    case 'google':
      return google(modelId)
    case 'openrouter': {
      const key = process.env.OPENROUTER_API_KEY
      if (!key) throw new Error('OPENROUTER_API_KEY is not set')
      const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: key,
      })
      return openrouter(modelId)
    }
    default:
      throw new Error(`Unknown LLM provider "${provider}" in model id "${id}"`)
  }
}

export { generateText, streamText, type LanguageModel } from 'ai'
