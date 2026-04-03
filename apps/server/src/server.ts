import type { WebSocket } from 'ws'
import type { ClientMessage, ServerEvent } from '@lynx/shared'
import { nanoid } from 'nanoid'
import consola from 'consola'
import { handleChat } from './llm/adapter.js'
import { listConversations, deleteConversation, updateConversationTitle } from './db/conversations.js'
import { getMessages } from './db/messages.js'

const logger = consola.withTag('WS')

export function handleConnection(ws: WebSocket) {
  const send = (event: ServerEvent) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(event))
    }
  }

  // Track active generation for cancellation
  let activeAbortController: AbortController | null = null

  ws.on('message', async (raw) => {
    try {
      const message: ClientMessage = JSON.parse(raw.toString())

      switch (message.type) {
        case 'chat': {
          const messageId = nanoid()

          // Cancel any previous generation
          if (activeAbortController) {
            activeAbortController.abort()
          }
          activeAbortController = new AbortController()

          send({
            type: 'status',
            messageId,
            payload: { status: 'thinking' }
          })

          try {
            await handleChat({
              userMessage: message.payload.text,
              conversationId: message.payload.conversationId,
              messageId,
              signal: activeAbortController.signal,
              onToken: (token) => {
                send({
                  type: 'token',
                  messageId,
                  payload: { token, generationId: messageId }
                })
              },
              onToolStart: (toolCallId, toolName, input) => {
                send({
                  type: 'tool-start',
                  messageId,
                  payload: { toolCallId, toolName, input }
                })
              },
              onToolResult: (toolCallId, toolName, result, status, durationMs) => {
                send({
                  type: 'tool-result',
                  messageId,
                  payload: { toolCallId, toolName, result, status, durationMs }
                })
              },
              onDone: (meta) => {
                send({
                  type: 'message-done',
                  messageId,
                  payload: meta
                })
              },
              onConversationId: (_conversationId) => {
                // Could be used to send conversation ID back to client if needed
              }
            })
          } catch (err: unknown) {
            if ((err as Error).name === 'AbortError') {
              logger.info('Generation cancelled')
              return
            }
            send({
              type: 'error',
              messageId,
              payload: {
                code: 'GENERATION_FAILED',
                message: (err as Error).message || 'Unknown error'
              }
            })
          } finally {
            activeAbortController = null
            send({
              type: 'status',
              messageId: null,
              payload: { status: 'idle' }
            })
          }
          break
        }

        case 'cancel': {
          if (activeAbortController) {
            activeAbortController.abort()
            activeAbortController = null
            logger.info('Generation cancelled by user')
          }
          break
        }

        case 'list-conversations': {
          const conversations = listConversations()
          send({
            type: 'conversations-list',
            messageId: message.id,
            payload: {
              conversations: conversations.map((c) => ({
                id: c.id,
                title: c.title,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
              }))
            }
          })
          break
        }

        case 'load-conversation': {
          const messages = getMessages(message.payload.conversationId)
          send({
            type: 'conversation-messages',
            messageId: message.id,
            payload: {
              conversationId: message.payload.conversationId,
              messages: messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt,
              }))
            }
          })
          break
        }

        case 'delete-conversation': {
          deleteConversation(message.payload.conversationId)
          send({
            type: 'conversation-deleted',
            messageId: message.id,
            payload: { conversationId: message.payload.conversationId }
          })
          logger.info(`Deleted conversation: ${message.payload.conversationId}`)
          break
        }

        case 'rename-conversation': {
          updateConversationTitle(message.payload.conversationId, message.payload.title)
          // Send updated list back so client stays in sync
          const updatedConversations = listConversations()
          send({
            type: 'conversations-list',
            messageId: message.id,
            payload: {
              conversations: updatedConversations.map((c) => ({
                id: c.id,
                title: c.title,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
              }))
            }
          })
          logger.info(`Renamed conversation: ${message.payload.conversationId}`)
          break
        }

        default:
          logger.warn('Unknown message type:', (message as ClientMessage).type)
      }
    } catch (err) {
      logger.error('Failed to parse message:', err)
    }
  })

  ws.on('close', () => {
    if (activeAbortController) {
      activeAbortController.abort()
    }
    logger.info('Client disconnected')
  })
}
