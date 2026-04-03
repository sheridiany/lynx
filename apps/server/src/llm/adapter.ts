import { streamText } from 'ai'
import consola from 'consola'
import { getProvider } from './providers.js'

const logger = consola.withTag('LLM')

// Simple in-memory conversation history for now
// Will be replaced with SQLite in Phase 0-W3
const conversationHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()

interface ChatOptions {
  userMessage: string
  conversationId: string | null
  messageId: string
  signal: AbortSignal
  onToken: (token: string) => void
  onToolStart: (toolCallId: string, toolName: string, input: Record<string, unknown>) => void
  onToolResult: (toolCallId: string, toolName: string, result: unknown, status: 'success' | 'error', durationMs: number) => void
  onDone: (meta: { totalTokens: { input: number; output: number }; durationMs: number; model: string; provider: string }) => void
}

const SYSTEM_PROMPT = `You are Lynx, a helpful personal AI assistant running on the user's desktop.
You are direct, concise, and action-oriented. You have a friendly but professional personality.
Current time: ${new Date().toISOString()}
Platform: ${process.platform}`

export async function handleChat(options: ChatOptions): Promise<void> {
  const { userMessage, conversationId, messageId, signal, onToken, onDone } = options
  const startTime = Date.now()

  // Get or create conversation history
  const convId = conversationId || messageId
  if (!conversationHistory.has(convId)) {
    conversationHistory.set(convId, [])
  }
  const history = conversationHistory.get(convId)!
  history.push({ role: 'user', content: userMessage })

  const provider = getProvider()
  if (!provider) {
    throw new Error('No LLM provider configured. Please set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY in your environment.')
  }

  logger.info(`Using provider: ${provider.name}, model: ${provider.modelId}`)

  const result = streamText({
    model: provider.model,
    system: SYSTEM_PROMPT,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
    abortSignal: signal,
    maxTokens: 4096,
    temperature: 0.7,
  })

  let fullText = ''

  for await (const chunk of result.textStream) {
    fullText += chunk
    onToken(chunk)
  }

  // Save assistant response to history
  history.push({ role: 'assistant', content: fullText })

  // Keep history manageable (last 40 messages)
  if (history.length > 40) {
    history.splice(0, history.length - 40)
  }

  const usage = await result.usage
  const durationMs = Date.now() - startTime

  onDone({
    totalTokens: {
      input: usage?.promptTokens ?? 0,
      output: usage?.completionTokens ?? 0
    },
    durationMs,
    model: provider.modelId,
    provider: provider.name
  })
}
