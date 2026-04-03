import type { Conversation } from '@lynx/shared'
import { getDatabase } from './database.js'

export function createConversation(id: string, title?: string): Conversation {
  const now = Date.now()
  const db = getDatabase()

  db.prepare(
    'INSERT INTO conversations (id, title, created_at, updated_at, archived) VALUES (?, ?, ?, ?, 0)'
  ).run(id, title ?? '', now, now)

  return {
    id,
    title: title ?? '',
    createdAt: now,
    updatedAt: now,
    archived: false,
  }
}

export function getConversation(id: string): Conversation | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as
    | { id: string; title: string; created_at: number; updated_at: number; archived: number }
    | undefined

  if (!row) return null

  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archived: row.archived === 1,
  }
}

export function listConversations(): Conversation[] {
  const db = getDatabase()
  const rows = db
    .prepare('SELECT * FROM conversations WHERE archived = 0 ORDER BY updated_at DESC')
    .all() as Array<{ id: string; title: string; created_at: number; updated_at: number; archived: number }>

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archived: row.archived === 1,
  }))
}

export function updateConversationTitle(id: string, title: string): void {
  const db = getDatabase()
  db.prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?').run(
    title,
    Date.now(),
    id
  )
}

export function deleteConversation(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id)
}

export function touchConversation(id: string): void {
  const db = getDatabase()
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(Date.now(), id)
}
