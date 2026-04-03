import type { Message } from '@lynx/shared'
import { getDatabase } from './database.js'

export function saveMessage(msg: {
  id: string
  conversationId: string
  role: string
  content: string
  metadata?: Record<string, unknown>
}): void {
  const db = getDatabase()
  db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    msg.id,
    msg.conversationId,
    msg.role,
    msg.content,
    msg.metadata ? JSON.stringify(msg.metadata) : null,
    Date.now()
  )
}

export function getMessages(conversationId: string, limit = 40): Message[] {
  const db = getDatabase()
  const rows = db
    .prepare(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?`
    )
    .all(conversationId, limit) as Array<{
    id: string
    conversation_id: string
    role: string
    content: string
    metadata: string | null
    created_at: number
  }>

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as Message['role'],
    content: row.content,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Message['metadata']) : null,
    parentId: null,
    createdAt: row.created_at,
  }))
}

export function deleteMessage(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM messages WHERE id = ?').run(id)
}
