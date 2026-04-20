#!/usr/bin/env node
// LLM 추상화 스모크 테스트
//
// 실행 (프로젝트 루트에서):
//   node --env-file=.env apps/api/scripts/smoke-llm.mjs [task] [prompt]
// 예:
//   node --env-file=.env apps/api/scripts/smoke-llm.mjs pm
//   node --env-file=.env apps/api/scripts/smoke-llm.mjs default "한 줄로 자기소개 해줘"

import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { bedrock } from '@ai-sdk/amazon-bedrock'

const DEFAULT_MODEL_ID = 'anthropic:claude-sonnet-4-5'

function hasAnyKey() {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_PROFILE,
  )
}

function resolveModel(id) {
  const sep = id.indexOf(':')
  if (sep <= 0) throw new Error(`잘못된 model id: "${id}" — "<provider>:<modelId>" 형식`)
  const provider = id.slice(0, sep)
  const modelId = id.slice(sep + 1)
  switch (provider) {
    case 'anthropic':
      return anthropic(modelId)
    case 'openai':
      return openai(modelId)
    case 'google':
      return google(modelId)
    case 'openrouter': {
      const key = process.env.OPENROUTER_API_KEY
      if (!key) throw new Error('OPENROUTER_API_KEY 미설정')
      return createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: key })(modelId)
    }
    case 'bedrock':
      return bedrock(modelId)
    default:
      throw new Error(`알 수 없는 provider: "${provider}"`)
  }
}

function modelIdFor(task) {
  const taskKey = `LLM_MODEL_${task.toUpperCase()}`
  return process.env[taskKey] ?? process.env.LLM_MODEL_DEFAULT ?? DEFAULT_MODEL_ID
}

async function main() {
  if (!hasAnyKey()) {
    console.error('❌ LLM 프로바이더 키가 하나도 설정되지 않았습니다.')
    console.error('   .env 의 ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY / OPENROUTER_API_KEY 중 하나를 설정하세요.')
    process.exit(1)
  }

  const task = process.argv[2] || 'default'
  const prompt =
    process.argv[3] ||
    '이 프로젝트는 AI 에이전트가 소프트웨어 외주 개발 전 과정을 수행하는 SaaS입니다. 어떤 에이전트가 등장할지 한 문장으로 상상해 주세요.'
  const id = modelIdFor(task)

  console.log(`📡 task="${task}"  model="${id}"`)
  console.log(`📝 prompt="${prompt.length > 80 ? prompt.slice(0, 80) + '...' : prompt}"`)
  console.log('─'.repeat(60))

  const started = Date.now()
  const { text, usage } = await generateText({
    model: resolveModel(id),
    prompt,
    maxOutputTokens: 300,
  })
  const elapsed = Date.now() - started

  console.log(text)
  console.log('─'.repeat(60))
  console.log(`✓ ${elapsed}ms  tokens: in=${usage.inputTokens ?? '?'} out=${usage.outputTokens ?? '?'}`)
}

main().catch((err) => {
  console.error('❌', err.message)
  if (err.cause) console.error('   cause:', err.cause)
  process.exit(1)
})
