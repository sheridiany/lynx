import { streamText } from 'ai'
import consola from 'consola'
import { nanoid } from 'nanoid'
import { getProvider } from './providers.js'
import { createConversation, getConversation, touchConversation, updateConversationTitle } from '../db/conversations.js'
import { saveMessage, getMessages } from '../db/messages.js'

const logger = consola.withTag('LLM')

// Small in-memory cache for the active conversation to avoid DB reads on every token
const activeConversationCache = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()

interface ChatOptions {
  userMessage: string
  conversationId: string | null
  messageId: string
  signal: AbortSignal
  onToken: (token: string) => void
  onToolStart: (toolCallId: string, toolName: string, input: Record<string, unknown>) => void
  onToolResult: (toolCallId: string, toolName: string, result: unknown, status: 'success' | 'error', durationMs: number) => void
  onDone: (meta: { totalTokens: { input: number; output: number }; durationMs: number; model: string; provider: string }) => void
  onConversationId: (conversationId: string) => void
}

const SYSTEM_PROMPT = `You are Lynx, a helpful personal AI assistant running on the user's desktop.
You are direct, concise, and action-oriented. You have a friendly but professional personality.
Current time: ${new Date().toISOString()}
Platform: ${process.platform}`

export async function handleChat(options: ChatOptions): Promise<void> {
  const { userMessage, conversationId, messageId, signal, onToken, onDone, onConversationId } = options
  const startTime = Date.now()

  // Resolve or create conversation
  let convId = conversationId || ''
  let isNewConversation = false

  if (!convId || !getConversation(convId)) {
    convId = conversationId || nanoid()
    const title = userMessage.slice(0, 50).trim() || 'New conversation'
    createConversation(convId, title)
    isNewConversation = true
    logger.info(`Created new conversation: ${convId}`)
  }

  // Notify caller of the conversation ID (useful when auto-created)
  onConversationId(convId)

  // Load history from cache or DB
  let history: Array<{ role: 'user' | 'assistant'; content: string }>
  if (activeConversationCache.has(convId)) {
    history = activeConversationCache.get(convId)!
  } else {
    const dbMessages = getMessages(convId, 40)
    history = dbMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    activeConversationCache.set(convId, history)
  }

  // Add user message to history and persist
  history.push({ role: 'user', content: userMessage })
  const userMsgId = nanoid()
  saveMessage({
    id: userMsgId,
    conversationId: convId,
    role: 'user',
    content: userMessage,
  })

  // Auto-title: update title from first user message if this is a new conversation
  if (isNewConversation) {
    const title = userMessage.slice(0, 50).trim() || 'New conversation'
    updateConversationTitle(convId, title)
  }

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

  // Save assistant response to history and DB
  history.push({ role: 'assistant', content: fullText })
  saveMessage({
    id: messageId,
    conversationId: convId,
    role: 'assistant',
    content: fullText,
  })

  // Update conversation timestamp
  touchConversation(convId)

  // Keep in-memory cache manageable (last 40 messages)
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
