import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'

export interface GenerateFeatureInput {
  projectName: string
  platforms: string[]
  naturalLanguage: string
}

export interface GenerateFeatureResult {
  title: string
  featureFile: string
  platforms: string[]
}

@Injectable()
export class PmAgentService {
  private readonly logger = new Logger(PmAgentService.name)
  private readonly client: Anthropic | null
  private readonly model: string

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY')
    this.client = apiKey ? new Anthropic({ apiKey }) : null
    this.model = config.get<string>('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514')
    if (!this.client) {
      this.logger.warn('ANTHROPIC_API_KEY not set — PM Agent will use dry-run mode')
    }
  }

  async generateFeature(input: GenerateFeatureInput): Promise<GenerateFeatureResult> {
    if (!this.client) {
      return this.dryRun(input)
    }

    const systemPrompt = `You are a PM Agent for a software development agency platform.
Your job is to convert natural language requirements into BDD Cucumber Feature files.

Rules:
- Output ONLY the Gherkin Feature file content — no explanation, no markdown fences.
- Include a Feature: line with a clear title.
- Each logical requirement becomes a Scenario.
- Use Given/When/Then steps with clear business language.
- Add @platform tags for each target platform: ${input.platforms.map((p) => `@${p.toLowerCase()}`).join(', ')}.
- Write in the same language as the input (Korean or English).`

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Project: ${input.projectName}\nPlatforms: ${input.platforms.join(', ')}\n\nRequirement (natural language):\n${input.naturalLanguage}`,
        },
      ],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const title = this.extractTitle(text, input.naturalLanguage)

    return {
      title,
      featureFile: text.trim(),
      platforms: input.platforms,
    }
  }

  private dryRun(input: GenerateFeatureInput): GenerateFeatureResult {
    const title = input.naturalLanguage.split('\n')[0].slice(0, 80)
    const tags = input.platforms.map((p) => `@${p.toLowerCase()}`).join(' ')
    const featureFile = `${tags}
Feature: ${title}
  Background:
    Given 프로젝트 "${input.projectName}"이(가) 설정되어 있다

  Scenario: ${title}
    Given 사용자가 시스템에 접속한다
    When 자연어 요구사항을 확인한다:
      """
      ${input.naturalLanguage}
      """
    Then 해당 기능이 구현되어야 한다

# [DRY-RUN] ANTHROPIC_API_KEY가 설정되지 않아 템플릿으로 생성됨
# 실제 환경에서는 Claude가 자연어를 분석하여 구체적인 시나리오를 생성합니다.`

    return { title, featureFile, platforms: input.platforms }
  }

  private extractTitle(featureText: string, fallback: string): string {
    const match = featureText.match(/^Feature:\s*(.+)$/m)
    return match?.[1]?.trim() ?? fallback.split('\n')[0].slice(0, 80)
  }
}
