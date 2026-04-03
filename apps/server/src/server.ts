import type { WebSocket } from 'ws'
import type { ClientMessage, ServerEvent } from '@lynx/shared'
import { nanoid } from 'nanoid'
import consola from 'consola'
import { handleChat } from './llm/adapter.js'

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
