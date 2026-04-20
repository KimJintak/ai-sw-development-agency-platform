import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { anthropic } from '@ai-sdk/anthropic'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

export type LlmTask = 'default' | 'pm' | 'triage' | 'summarize'

export const DEFAULT_MODEL_ID = 'anthropic:claude-sonnet-4-5'

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name)

  constructor(private readonly config: ConfigService) {
    if (!this.hasAnyKey) {
      this.logger.warn(
        'No LLM provider key set (ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY / OPENROUTER_API_KEY) — LLM-dependent services will fall back to dry-run mode',
      )
    }
  }

  get hasAnyKey(): boolean {
    return Boolean(
      this.config.get<string>('ANTHROPIC_API_KEY') ||
        this.config.get<string>('OPENAI_API_KEY') ||
        this.config.get<string>('GOOGLE_GENERATIVE_AI_API_KEY') ||
        this.config.get<string>('OPENROUTER_API_KEY'),
    )
  }

  /** Resolve the model configured for a task, honoring `LLM_MODEL_<TASK>` with fallback to `LLM_MODEL_DEFAULT`. */
  modelFor(task: LlmTask = 'default'): LanguageModel {
    const taskKey = `LLM_MODEL_${task.toUpperCase()}`
    const id =
      this.config.get<string>(taskKey) ??
      this.config.get<string>('LLM_MODEL_DEFAULT', DEFAULT_MODEL_ID)
    return this.resolve(id)
  }

  /** Parse a model id of the form "<provider>:<modelId>". */
  resolve(id: string): LanguageModel {
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
        const key = this.config.get<string>('OPENROUTER_API_KEY')
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
}
