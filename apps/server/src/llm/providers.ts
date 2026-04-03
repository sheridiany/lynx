import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGroq } from '@ai-sdk/groq'
import consola from 'consola'
import type { LanguageModelV1 } from 'ai'

const logger = consola.withTag('Providers')

interface ResolvedProvider {
  name: string
  modelId: string
  model: LanguageModelV1
}

/**
 * Resolve the best available provider from environment variables.
 * Priority: Anthropic > OpenAI > Groq
 */
export function getProvider(): ResolvedProvider | null {
  // Anthropic
  const anthropicKey = process.env['ANTHROPIC_API_KEY']
  if (anthropicKey) {
    const modelId = process.env['ANTHROPIC_MODEL'] || 'claude-sonnet-4-20250514'
    const anthropic = createAnthropic({ apiKey: anthropicKey })
    logger.info(`Resolved provider: Anthropic (${modelId})`)
    return {
      name: 'anthropic',
      modelId,
      model: anthropic(modelId)
    }
  }

  // OpenAI
  const openaiKey = process.env['OPENAI_API_KEY']
  if (openaiKey) {
    const modelId = process.env['OPENAI_MODEL'] || 'gpt-4o'
    const openai = createOpenAI({ apiKey: openaiKey })
    logger.info(`Resolved provider: OpenAI (${modelId})`)
    return {
      name: 'openai',
      modelId,
      model: openai(modelId)
    }
  }

  // Groq
  const groqKey = process.env['GROQ_API_KEY']
  if (groqKey) {
    const modelId = process.env['GROQ_MODEL'] || 'llama-3.3-70b-versatile'
    const groq = createGroq({ apiKey: groqKey })
    logger.info(`Resolved provider: Groq (${modelId})`)
    return {
      name: 'groq',
      modelId,
      model: groq(modelId)
    }
  }

  logger.warn('No LLM provider API key found in environment')
  return null
}
