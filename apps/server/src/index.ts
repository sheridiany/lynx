import { createServer } from 'node:http'
import dotenv from 'dotenv'
import consola from 'consola'
import { WebSocketServer } from 'ws'
import { WS_PORT, APP_NAME, APP_VERSION } from '@lynx/shared'
import { handleConnection } from './server.js'
import { initDatabase } from './db/database.js'

dotenv.config()

const logger = consola.withTag(APP_NAME)

async function main() {
  logger.info(`${APP_NAME} Server v${APP_VERSION} starting...`)

  // Initialize SQLite database
  initDatabase()

  const httpServer = createServer()
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws) => {
    logger.info('Client connected')
    handleConnection(ws)
  })

  httpServer.listen(WS_PORT, () => {
    logger.success(`Server listening on ws://localhost:${WS_PORT}/ws`)
  })

  process.on('SIGINT', () => {
    logger.info('Shutting down...')
    wss.close()
    httpServer.close()
    process.exit(0)
  })
}

main().catch((err) => {
  logger.error('Fatal error:', err)
  process.exit(1)
})
