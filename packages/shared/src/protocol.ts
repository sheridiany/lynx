import type { Attachment, PlanStep } from './types'

// ============ Client → Server Messages ============

export interface ChatMessage {
  type: 'chat'
  id: string
  payload: {
    text: string
    conversationId: string | null
    attachments?: Attachment[]
  }
}

export interface CancelMessage {
  type: 'cancel'
  id: string
  payload: {
    messageId: string
  }
}

export interface WidgetActionMessage {
  type: 'widget-action'
  id: string
  payload: {
    widgetId: string
    action: string
    data: unknown
  }
}

export type ClientMessage = ChatMessage | CancelMessage | WidgetActionMessage

// ============ Server → Client Events ============

export interface TokenEvent {
  type: 'token'
  messageId: string
  payload: {
    token: string
    generationId: string
  }
}

export interface ToolStartEvent {
  type: 'tool-start'
  messageId: string
  payload: {
    toolCallId: string
    toolName: string
    input: Record<string, unknown>
  }
}

export interface ToolResultEvent {
  type: 'tool-result'
  messageId: string
  payload: {
    toolCallId: string
    toolName: string
    result: unknown
    status: 'success' | 'error'
    durationMs: number
  }
}

export interface PlanUpdateEvent {
  type: 'plan-update'
  messageId: string
  payload: {
    planId: string
    steps: PlanStep[]
  }
}

export interface WidgetEvent {
  type: 'widget'
  messageId: string
  payload: {
    widgetId: string
    widgetType: string
    data: Record<string, unknown>
  }
}

export interface MessageDoneEvent {
  type: 'message-done'
  messageId: string
  payload: {
    totalTokens: { input: number; output: number }
    durationMs: number
    model: string
    provider: string
  }
}

export interface ErrorEvent {
  type: 'error'
  messageId: string | null
  payload: {
    code: string
    message: string
  }
}

export interface StatusEvent {
  type: 'status'
  messageId: string | null
  payload: {
    status: 'typing' | 'thinking' | 'idle' | 'tool-calling'
  }
}

export type ServerEvent =
  | TokenEvent
  | ToolStartEvent
  | ToolResultEvent
  | PlanUpdateEvent
  | WidgetEvent
  | MessageDoneEvent
  | ErrorEvent
  | StatusEvent
