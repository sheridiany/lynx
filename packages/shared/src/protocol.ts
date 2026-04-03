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

export interface ListConversationsMessage {
  type: 'list-conversations'
  id: string
}

export interface LoadConversationMessage {
  type: 'load-conversation'
  id: string
  payload: { conversationId: string }
}

export interface DeleteConversationMessage {
  type: 'delete-conversation'
  id: string
  payload: { conversationId: string }
}

export interface RenameConversationMessage {
  type: 'rename-conversation'
  id: string
  payload: { conversationId: string; title: string }
}

export type ClientMessage =
  | ChatMessage
  | CancelMessage
  | WidgetActionMessage
  | ListConversationsMessage
  | LoadConversationMessage
  | DeleteConversationMessage
  | RenameConversationMessage

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

export interface ConversationsListEvent {
  type: 'conversations-list'
  messageId: string | null
  payload: {
    conversations: Array<{ id: string; title: string; createdAt: number; updatedAt: number }>
  }
}

export interface ConversationMessagesEvent {
  type: 'conversation-messages'
  messageId: string | null
  payload: {
    conversationId: string
    messages: Array<{ id: string; role: string; content: string; createdAt: number }>
  }
}

export interface ConversationDeletedEvent {
  type: 'conversation-deleted'
  messageId: string | null
  payload: { conversationId: string }
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
  | ConversationsListEvent
  | ConversationMessagesEvent
  | ConversationDeletedEvent
