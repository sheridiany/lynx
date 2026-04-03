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

  // Actions
  connect: () => void
  disconnect: () => void
  sendMessage: (text: string) => void
  cancelGeneration: () => void
  createConversation: () => void
  setActiveConversation: (id: string) => void
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

  connect: () => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}/ws`)

    ws.onopen = () => {
      set({ ws, connected: true })
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
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
    const { ws, connected, activeConversationId } = get()
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
        conversationId: activeConversationId
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
    set({ activeConversationId: id, messages: [] })
    // TODO: load messages from database
  }
}))
