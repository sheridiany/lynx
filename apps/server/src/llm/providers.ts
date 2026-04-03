import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGroq } from '@ai-sdk/groq'
import consola from 'consola'
import type { LanguageModelV1 } from 'ai'

const logger = consola.withTag('Providers')

export interface ResolvedProvider {
  name: string
  modelId: string
  model: LanguageModelV1
}

/**
 * Available models via the proxy / direct providers.
 * The UI can request any of these by id.
 */
export const AVAILABLE_MODELS = [
  // Anthropic
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'anthropic' },
  // OpenAI
  { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'openai' },
  { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', provider: 'openai' },
  { id: 'gpt-5.3-codex-spark', name: 'GPT-5.3 Codex Spark', provider: 'openai' },
  // Google
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'google' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', provider: 'google' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Flash Image', provider: 'google' },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image', provider: 'google' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', provider: 'google' },
  // xAI
  { id: 'grok-4.20-beta', name: 'Grok 4.20 Beta', provider: 'xai' },
  { id: 'grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xai' },
] as const

/**
 * Resolve a model by its ID.
 * Supports two modes:
 *   1. Proxy mode: LLM_BASE_URL + LLM_API_KEY  (all models through one endpoint)
 *   2. Direct mode: ANTHROPIC_API_KEY / OPENAI_API_KEY / GROQ_API_KEY
 */
export function getProvider(requestedModelId?: string): ResolvedProvider | null {
  const baseUrl = process.env['LLM_BASE_URL']
  const proxyKey = process.env['LLM_API_KEY']
  const modelId = requestedModelId || process.env['LLM_DEFAULT_MODEL'] || 'claude-sonnet-4-6'

  // ─── Mode 1: Proxy / Relay (one endpoint for all) ───
  if (baseUrl && proxyKey) {
    return resolveViaProxy(baseUrl, proxyKey, modelId)
  }

  // ─── Mode 2: Direct provider keys ───
  return resolveDirectProvider(modelId)
}

function resolveViaProxy(baseUrl: string, apiKey: string, modelId: string): ResolvedProvider {
  const modelEntry = AVAILABLE_MODELS.find((m) => m.id === modelId)
  const providerName = modelEntry?.provider || detectProvider(modelId)

  // Proxy/relay services use OpenAI-compatible Chat Completions format
  // for ALL models (Claude, Gemini, Grok, etc.).
  // IMPORTANT: use .chat() to force /v1/chat/completions endpoint.
  // The default openai() uses the newer Responses API (/v1/responses)
  // which most proxies don't support.
  const openai = createOpenAI({
    apiKey,
    baseURL: baseUrl,
    compatibility: 'compatible',
  })
  logger.info(`Proxy → ${providerName}: ${modelId} via ${baseUrl}`)
  return { name: providerName, modelId, model: openai.chat(modelId) }
}

function resolveDirectProvider(modelId: string): ResolvedProvider | null {
  // Anthropic
  const anthropicKey = process.env['ANTHROPIC_API_KEY']
  if (anthropicKey) {
    const id = modelId.startsWith('claude') ? modelId : 'claude-sonnet-4-20250514'
    const anthropic = createAnthropic({ apiKey: anthropicKey })
    logger.info(`Direct → Anthropic: ${id}`)
    return { name: 'anthropic', modelId: id, model: anthropic(id) }
  }

  // OpenAI
  const openaiKey = process.env['OPENAI_API_KEY']
  if (openaiKey) {
    const id = modelId.startsWith('gpt') || modelId.startsWith('o3') || modelId.startsWith('o4') ? modelId : 'gpt-4o'
    const openai = createOpenAI({ apiKey: openaiKey })
    logger.info(`Direct → OpenAI: ${id}`)
    return { name: 'openai', modelId: id, model: openai(id) }
  }

  // Groq
  const groqKey = process.env['GROQ_API_KEY']
  if (groqKey) {
    const id = modelId.startsWith('llama') ? modelId : 'llama-3.3-70b-versatile'
    const groq = createGroq({ apiKey: groqKey })
    logger.info(`Direct → Groq: ${id}`)
    return { name: 'groq', modelId: id, model: groq(id) }
  }

  logger.warn('No LLM provider configured. Set LLM_BASE_URL+LLM_API_KEY or a direct provider key.')
  return null
}

function detectProvider(modelId: string): string {
  if (modelId.startsWith('claude')) return 'anthropic'
  if (modelId.startsWith('gpt') || modelId.startsWith('o3') || modelId.startsWith('o4')) return 'openai'
  if (modelId.startsWith('gemini')) return 'google'
  if (modelId.startsWith('grok')) return 'xai'
  if (modelId.startsWith('llama') || modelId.startsWith('mixtral')) return 'groq'
  return 'openai' // fallback
}
