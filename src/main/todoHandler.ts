import { randomUUID } from 'node:crypto'
import { ipcMain } from 'electron'
import { db } from './db'
import type { TodoItem, TodoStatus } from '../shared/todo.type'

type TodoRow = {
  id: string
  title: string
  is_completed: number
  status: TodoStatus
  created_at: string
  parent_id: string | null
}

export function registerTodoHandlers(): void {
  ipcMain.handle('todos:getAll', (): TodoItem[] => {
    const rows = db
      .prepare(
        `
        SELECT id, title, is_completed, status, created_at, parent_id
        FROM todos
        ORDER BY created_at DESC, id DESC
      `
      )
      .all() as TodoRow[]

    const byId = new Map<string, TodoItem>()
    const roots: TodoItem[] = []

    for (const row of rows) {
      byId.set(row.id, {
        id: row.id,
        title: row.title,
        isCompleted: row.is_completed === 1,
        status: row.status,
        createdAt: row.created_at,
        subtasks: []
      })
    }

    for (const row of rows) {
      const todo = byId.get(row.id)!
      const parent = row.parent_id ? byId.get(row.parent_id) : undefined

      if (parent && parent !== todo) {
        parent.subtasks!.push(todo)
      } else {
        roots.push(todo)
      }
    }

    return roots
  })

  ipcMain.handle('todos:add', (_, title: string, parentId?: string): TodoItem => {
    if (typeof title !== 'string' || !title.trim()) {
      throw new Error('عنوان کار معتبر نیست.')
    }

    let status: 'active' | 'deactive' = 'deactive'

    if (parentId) {
      const parent = db.prepare('SELECT status FROM todos WHERE id = ?').get(parentId) as
        { status: TodoStatus } | undefined

      if (!parent) throw new Error('کار والد پیدا نشد.')

      status = parent.status === 'active' ? 'active' : 'deactive'
    }

    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const cleanTitle = title.trim()

    db.prepare(
      `
        INSERT INTO todos
          (id, title, is_completed, status, created_at, parent_id)
        VALUES (?, ?, 0, ?, ?, ?)
      `
    ).run(id, cleanTitle, status, createdAt, parentId ?? null)

    return {
      id,
      title: cleanTitle,
      isCompleted: false,
      status,
      createdAt,
      subtasks: []
    }
  })

  ipcMain.handle('todos:toggle', (_, id: string, completed: boolean): boolean => {
    if (typeof id !== 'string' || typeof completed !== 'boolean') {
      throw new Error('ورودی نامعتبر است.')
    }

    if (completed) {
      const result = db
        .prepare(
          `
          UPDATE todos
          SET
            previous_status = status,
            status = 'completed',
            is_completed = 1
          WHERE id = ?
            AND status IN ('active', 'deactive')
        `
        )
        .run(id)

      return result.changes > 0
    }

    const result = db
      .prepare(
        `
        UPDATE todos
        SET
          status = COALESCE(previous_status, 'deactive'),
          previous_status = NULL,
          is_completed = 0
        WHERE id = ?
          AND status = 'completed'
      `
      )
      .run(id)

    return result.changes > 0
  })

  ipcMain.handle('todos:move', (_, id: string, target: 'active' | 'deactive'): boolean => {
    if (typeof id !== 'string' || (target !== 'active' && target !== 'deactive')) {
      throw new Error('مقصد انتقال نامعتبر است.')
    }

    const result = db
      .prepare(
        `
        UPDATE todos
        SET status = ?, is_completed = 0
        WHERE id = ?
          AND status IN ('active', 'deactive')
          AND status <> ?
      `
      )
      .run(target, id, target)

    return result.changes > 0
  })

  ipcMain.handle('todos:delete', (_, id: string): boolean => {
    if (typeof id !== 'string') {
      throw new Error('شناسه نامعتبر است.')
    }

    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id)

    return result.changes > 0
  })
}
