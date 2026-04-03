// ============ Conversations ============

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  archived: boolean
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  metadata: MessageMetadata | null
  parentId: string | null
  createdAt: number
}

export interface MessageMetadata {
  model?: string
  provider?: string
  inputTokens?: number
  outputTokens?: number
  durationMs?: number
  toolCalls?: ToolCallRecord[]
}

export interface ToolCallRecord {
  id: string
  toolName: string
  input: Record<string, unknown>
  output: unknown
  status: 'success' | 'error' | 'timeout'
  durationMs: number
}

// ============ Attachments ============

export interface Attachment {
  id: string
  type: 'image' | 'file' | 'url'
  name: string
  mimeType?: string
  url?: string
  data?: string // base64 for images
}

// ============ Plan ============

export type PlanStepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'

export interface PlanStep {
  id: string
  description: string
  status: PlanStepStatus
  toolName?: string
  result?: string
}

// ============ LLM Provider Config ============

export type LLMProviderType =
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'openrouter'
  | 'cerebras'
  | 'xai'
  | 'llamacpp'

export interface LLMProviderConfig {
  provider: LLMProviderType
  model: string
  apiKey?: string
  baseUrl?: string
  modelPath?: string // for local models
}

export interface LynxConfig {
  providers: {
    default: LLMProviderConfig
    fast?: LLMProviderConfig
    local?: LLMProviderConfig
  }
  persona: {
    name: string
    personality: string
    customInstructions: string
  }
  appearance: {
    theme: 'dark' | 'light' | 'system'
    accentColor: string
  }
  privacy: {
    autoExtractMemory: boolean
    telemetry: boolean
  }
}

// ============ Tool Definition (for display) ============

export interface ToolInfo {
  name: string
  description: string
  category: string
  iconName?: string
}
