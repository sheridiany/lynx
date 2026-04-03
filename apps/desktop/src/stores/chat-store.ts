import { create } from 'zustand'
import type { MessageRole, ServerEvent, Conversation } from '@lynx/shared'
import { WS_PORT } from '@lynx/shared'

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: number
}

interface ChatState {
  // Connection
  ws: WebSocket | null
  connected: boolean

  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null

  // Messages for active conversation
  messages: ChatMessage[]
  isStreaming: boolean
  streamingMessageId: string | null

  // Model selection
  selectedModel: string

  // Actions
  connect: () => void
  disconnect: () => void
  sendMessage: (text: string) => void
  cancelGeneration: () => void
  createConversation: () => void
  setActiveConversation: (id: string) => void
  setSelectedModel: (modelId: string) => void
  regenerateLastMessage: () => void
  requestConversationList: () => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
}

let reconnectTimer: ReturnType<typeof setTimeout> | null = null

export const useChatStore = create<ChatState>((set, get) => ({
  ws: null,
  connected: false,
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingMessageId: null,
  selectedModel: 'claude-sonnet-4-6',

  connect: () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}/ws`)

    ws.onopen = () => {
      set({ ws, connected: true })
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      // Load conversations from server on connect
      ws.send(JSON.stringify({ type: 'list-conversations', id: crypto.randomUUID() }))
    }

    ws.onmessage = (event) => {
      const data: ServerEvent = JSON.parse(event.data)

      switch (data.type) {
        case 'token': {
          set((state) => {
            const msgs = [...state.messages]
            const lastMsg = msgs[msgs.length - 1]

            if (lastMsg && lastMsg.id === state.streamingMessageId) {
              lastMsg.content += data.payload.token
              return { messages: msgs }
            }

            // Create new assistant message
            msgs.push({
              id: data.messageId,
              role: 'assistant',
              content: data.payload.token,
              createdAt: Date.now()
            })
            return { messages: msgs, streamingMessageId: data.messageId, isStreaming: true }
          })
          break
        }

        case 'message-done': {
          set({ isStreaming: false, streamingMessageId: null })
          // Refresh conversation list to pick up new titles
          ws.send(JSON.stringify({ type: 'list-conversations', id: crypto.randomUUID() }))
          break
        }

        case 'conversations-list': {
          const serverConvs = data.payload.conversations.map((c) => ({
            id: c.id,
            title: c.title,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            archived: false,
          }))
          set({ conversations: serverConvs })
          break
        }

        case 'conversation-messages': {
          const loadedMessages: ChatMessage[] = data.payload.messages.map((m) => ({
            id: m.id,
            role: m.role as MessageRole,
            content: m.content,
            createdAt: m.createdAt,
          }))
          set({ messages: loadedMessages, activeConversationId: data.payload.conversationId })
          break
        }

        case 'conversation-deleted': {
          set((state) => {
            const filtered = state.conversations.filter((c) => c.id !== data.payload.conversationId)
            const needsClear = state.activeConversationId === data.payload.conversationId
            return {
              conversations: filtered,
              ...(needsClear ? { activeConversationId: null, messages: [] } : {}),
            }
          })
          break
        }

        case 'error': {
          set((state) => ({
            messages: [
              ...state.messages,
              {
                id: data.messageId || `error-${Date.now()}`,
                role: 'assistant' as const,
                content: `Error: ${data.payload.message}`,
                createdAt: Date.now()
              }
            ],
            isStreaming: false,
            streamingMessageId: null
          }))
          break
        }

        case 'status': {
          if (data.payload.status === 'idle') {
            set({ isStreaming: false })
          } else if (data.payload.status === 'thinking') {
            set({ isStreaming: true })
          }
          break
        }
      }
    }

    ws.onclose = () => {
      set({ ws: null, connected: false })
      // Auto-reconnect after 2s
      reconnectTimer = setTimeout(() => {
        get().connect()
      }, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }
  },

  disconnect: () => {
    const { ws } = get()
    if (ws) ws.close()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    set({ ws: null, connected: false })
  },

  sendMessage: (text) => {
    const { ws, connected, activeConversationId, selectedModel } = get()
    if (!ws || !connected) return

    const messageId = crypto.randomUUID()

    // Add user message to local state
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: messageId,
          role: 'user',
          content: text,
          createdAt: Date.now()
        }
      ]
    }))

    // Send to server
    ws.send(JSON.stringify({
      type: 'chat',
      id: messageId,
      payload: {
        text,
        conversationId: activeConversationId,
        modelId: selectedModel
      }
    }))
  },

  cancelGeneration: () => {
    const { ws, connected, streamingMessageId } = get()
    if (!ws || !connected || !streamingMessageId) return

    ws.send(JSON.stringify({
      type: 'cancel',
      id: crypto.randomUUID(),
      payload: { messageId: streamingMessageId }
    }))

    set({ isStreaming: false, streamingMessageId: null })
  },

  createConversation: () => {
    const id = crypto.randomUUID()
    set((state) => ({
      conversations: [
        { id, title: '', createdAt: Date.now(), updatedAt: Date.now(), archived: false },
        ...state.conversations
      ],
      activeConversationId: id,
      messages: []
    }))
  },

  setActiveConversation: (id) => {
    const { ws, connected } = get()
    set({ activeConversationId: id, messages: [] })
    // Load messages from server
    if (ws && connected) {
      ws.send(JSON.stringify({
        type: 'load-conversation',
        id: crypto.randomUUID(),
        payload: { conversationId: id }
      }))
    }
  },

  setSelectedModel: (modelId) => {
    set({ selectedModel: modelId })
  },

  requestConversationList: () => {
    const { ws, connected } = get()
    if (ws && connected) {
      ws.send(JSON.stringify({ type: 'list-conversations', id: crypto.randomUUID() }))
    }
  },

  deleteConversation: (id) => {
    const { ws, connected } = get()
    if (ws && connected) {
      ws.send(JSON.stringify({
        type: 'delete-conversation',
        id: crypto.randomUUID(),
        payload: { conversationId: id }
      }))
    }
  },

  renameConversation: (id, title) => {
    const { ws, connected } = get()
    if (ws && connected) {
      ws.send(JSON.stringify({
        type: 'rename-conversation',
        id: crypto.randomUUID(),
        payload: { conversationId: id, title }
      }))
    }
  },

  regenerateLastMessage: () => {
    const { messages, ws, connected, activeConversationId, selectedModel, isStreaming } = get()
    if (!ws || !connected || isStreaming) return

    // Find the last assistant message and the last user message before it
    let lastAssistantIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        lastAssistantIdx = i
        break
      }
    }
    if (lastAssistantIdx === -1) return

    // Find the last user message before (or at) lastAssistantIdx
    let lastUserMsg: ChatMessage | null = null
    for (let i = lastAssistantIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i]
        break
      }
    }
    if (!lastUserMsg) return

    // Remove the last assistant message
    const newMessages = messages.filter((_, idx) => idx !== lastAssistantIdx)
    set({ messages: newMessages })

    // Re-send the user message
    const messageId = crypto.randomUUID()
    ws.send(JSON.stringify({
      type: 'chat',
      id: messageId,
      payload: {
        text: lastUserMsg.content,
        conversationId: activeConversationId,
        modelId: selectedModel
      }
    }))
  }
}))
