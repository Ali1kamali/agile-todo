import { randomUUID } from 'node:crypto'
import { ipcMain } from 'electron'
import { db } from './db'
import type { TodoItem, TodoStatus, Cycle, CreateCycleDTO } from '../shared/todo.type'

type TodoRow = {
  id: string
  title: string
  is_completed: number
  status: TodoStatus
  created_at: string
  parent_id: string | null
  cycle_id: string | null
  note: string | null
}

type CycleRow = {
  id: string
  title: string
  start_date: string
  end_date: string
  duration_days: number
  status: 'active' | 'archived'
  created_at: string
}

function mapCycle(row: CycleRow): Cycle {
  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    durationDays: row.duration_days,
    status: row.status,
    createdAt: row.created_at
  }
}

export function registerTodoHandlers(): void {
  // --- Cycle Handlers ---
  ipcMain.handle('cycles:getActive', (): Cycle | null => {
    const row = db.prepare("SELECT * FROM cycles WHERE status = 'active' ORDER BY created_at DESC LIMIT 1").get() as CycleRow | undefined
    return row ? mapCycle(row) : null
  })

  ipcMain.handle('cycles:getAll', (): Cycle[] => {
    const rows = db.prepare("SELECT * FROM cycles ORDER BY created_at DESC").all() as CycleRow[]
    return rows.map(mapCycle)
  })

  ipcMain.handle('cycles:create', (_, dto: CreateCycleDTO): Cycle => {
    if (!dto.title?.trim()) {
      throw new Error('عنوان دوره نمی‌تواند خالی باشد.')
    }
    if (!dto.startDate || !dto.endDate) {
      throw new Error('تاریخ شروع و پایان دوره مشخص نیست.')
    }

    const start = new Date(dto.startDate).getTime()
    const end = new Date(dto.endDate).getTime()
    if (isNaN(start) || isNaN(end) || end <= start) {
      throw new Error('تاریخ پایان باید بعد از تاریخ شروع باشد.')
    }

    // Maximum 6 months validation (roughly 186 days)
    const durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
    if (durationDays > 186) {
      throw new Error('مدت زمان دوره نمی‌تواند بیشتر از ۶ ماه باشد.')
    }

    const newCycleId = randomUUID()
    const nowIso = new Date().toISOString()

    const createTransaction = db.transaction(() => {
      // Find current active cycle if any
      const currentActive = db.prepare("SELECT id FROM cycles WHERE status = 'active'").all() as { id: string }[]

      // Archive previous active cycles
      db.prepare("UPDATE cycles SET status = 'archived' WHERE status = 'active'").run()

      // Insert new cycle
      db.prepare(`
        INSERT INTO cycles (id, title, start_date, end_date, duration_days, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
      `).run(newCycleId, dto.title.trim(), dto.startDate, dto.endDate, durationDays, nowIso)

      // If transferUnfinishedTasks is requested, move active/deactive root tasks and their trees
      if (dto.transferUnfinishedTasks && currentActive.length > 0) {
        const activeIds = currentActive.map((c) => c.id)
        const placeholders = activeIds.map(() => '?').join(',')

        // Move all unfinished tasks from previous cycles to new cycle
        db.prepare(`
          UPDATE todos
          SET cycle_id = ?
          WHERE cycle_id IN (${placeholders})
            AND status IN ('active', 'deactive')
        `).run(newCycleId, ...activeIds)

        // Make sure any subtasks attached to transferred parents follow along
        db.prepare(`
          UPDATE todos
          SET cycle_id = ?
          WHERE parent_id IN (SELECT id FROM todos WHERE cycle_id = ?)
        `).run(newCycleId, newCycleId)
      }

      // Insert tasks defined in DTO
      function insertTaskTree(
        task: { title: string; note?: string; subtasks?: any[] },
        parentId: string | null = null
      ) {
        if (!task.title?.trim()) return
        const taskId = randomUUID()
        const createdAt = new Date().toISOString()

        db.prepare(`
          INSERT INTO todos (id, title, is_completed, status, created_at, parent_id, cycle_id, note)
          VALUES (?, ?, 0, 'deactive', ?, ?, ?, ?)
        `).run(taskId, task.title.trim(), createdAt, parentId, newCycleId, task.note?.trim() || null)

        if (Array.isArray(task.subtasks)) {
          for (const sub of task.subtasks) {
            insertTaskTree(sub, taskId)
          }
        }
      }

      if (Array.isArray(dto.tasks)) {
        for (const task of dto.tasks) {
          insertTaskTree(task, null)
        }
      }
    })

    createTransaction()

    const created = db.prepare('SELECT * FROM cycles WHERE id = ?').get(newCycleId) as CycleRow
    return mapCycle(created)
  })

  // --- Todo Handlers ---
  ipcMain.handle('todos:getAll', (_, cycleId?: string): TodoItem[] => {
    let rows: TodoRow[]
    if (cycleId) {
      rows = db.prepare(`
        SELECT id, title, is_completed, status, created_at, parent_id, cycle_id, note
        FROM todos
        WHERE cycle_id = ?
        ORDER BY created_at ASC, id ASC
      `).all(cycleId) as TodoRow[]
    } else {
      // Default to active cycle's todos
      const activeCycle = db.prepare("SELECT id FROM cycles WHERE status = 'active' LIMIT 1").get() as { id: string } | undefined
      if (activeCycle) {
        rows = db.prepare(`
          SELECT id, title, is_completed, status, created_at, parent_id, cycle_id, note
          FROM todos
          WHERE cycle_id = ?
          ORDER BY created_at ASC, id ASC
        `).all(activeCycle.id) as TodoRow[]
      } else {
        rows = db.prepare(`
          SELECT id, title, is_completed, status, created_at, parent_id, cycle_id, note
          FROM todos
          ORDER BY created_at ASC, id ASC
        `).all() as TodoRow[]
      }
    }

    const byId = new Map<string, TodoItem>()
    const roots: TodoItem[] = []

    for (const row of rows) {
      byId.set(row.id, {
        id: row.id,
        title: row.title,
        isCompleted: row.is_completed === 1,
        status: row.status,
        createdAt: row.created_at,
        parentId: row.parent_id,
        cycleId: row.cycle_id,
        note: row.note ?? undefined,
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

  ipcMain.handle('todos:add', (_, title: string, parentId?: string, note?: string): TodoItem => {
    if (typeof title !== 'string' || !title.trim()) {
      throw new Error('عنوان کار معتبر نیست.')
    }

    let status: 'active' | 'deactive' = 'deactive'
    let cycleId: string | null = null

    if (parentId) {
      const parent = db.prepare('SELECT status, cycle_id FROM todos WHERE id = ?').get(parentId) as
        { status: TodoStatus; cycle_id: string | null } | undefined

      if (!parent) throw new Error('کار والد پیدا نشد.')

      status = parent.status === 'active' ? 'active' : 'deactive'
      cycleId = parent.cycle_id
    } else {
      const activeCycle = db.prepare("SELECT id FROM cycles WHERE status = 'active' LIMIT 1").get() as { id: string } | undefined
      cycleId = activeCycle ? activeCycle.id : null
    }

    const id = randomUUID()
    const createdAt = new Date().toISOString()
    const cleanTitle = title.trim()
    const cleanNote = note?.trim() || null

    db.prepare(`
      INSERT INTO todos (id, title, is_completed, status, created_at, parent_id, cycle_id, note)
      VALUES (?, ?, 0, ?, ?, ?, ?, ?)
    `).run(id, cleanTitle, status, createdAt, parentId ?? null, cycleId, cleanNote)

    return {
      id,
      title: cleanTitle,
      isCompleted: false,
      status,
      createdAt,
      parentId: parentId ?? null,
      cycleId,
      note: cleanNote ?? undefined,
      subtasks: []
    }
  })

  ipcMain.handle('todos:update', (_, id: string, data: { title?: string; note?: string }): boolean => {
    if (typeof id !== 'string') throw new Error('شناسه نامعتبر است.')

    const updates: string[] = []
    const params: any[] = []

    if (data.title !== undefined) {
      if (!data.title.trim()) throw new Error('عنوان نمی‌تواند خالی باشد.')
      updates.push('title = ?')
      params.push(data.title.trim())
    }

    if (data.note !== undefined) {
      updates.push('note = ?')
      params.push(data.note.trim() || null)
    }

    if (updates.length === 0) return true

    params.push(id)
    const result = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    return result.changes > 0
  })

  ipcMain.handle('todos:toggle', (_, id: string, completed: boolean): boolean => {
    if (typeof id !== 'string' || typeof completed !== 'boolean') {
      throw new Error('ورودی نامعتبر است.')
    }

    // Toggle completion recursively if needed, or update single task
    // When completed: mark task completed, remember previous_status
    if (completed) {
      const result = db.prepare(`
        UPDATE todos
        SET
          previous_status = status,
          status = 'completed',
          is_completed = 1
        WHERE id = ?
      `).run(id)
      return result.changes > 0
    }

    // When uncompleted: restore previous status or default to deactive
    const result = db.prepare(`
      UPDATE todos
      SET
        status = COALESCE(previous_status, 'deactive'),
        previous_status = NULL,
        is_completed = 0
      WHERE id = ?
    `).run(id)

    return result.changes > 0
  })

  ipcMain.handle('todos:move', (_, id: string, target: 'active' | 'deactive'): boolean => {
    if (typeof id !== 'string' || (target !== 'active' && target !== 'deactive')) {
      throw new Error('مقصد انتقال نامعتبر است.')
    }

    // Recursive helper to move whole descendant tree to same target status if not completed
    const moveTransaction = db.transaction(() => {
      // Update the parent
      db.prepare(`
        UPDATE todos
        SET status = ?, is_completed = 0
        WHERE id = ?
      `).run(target, id)

      // Also recursively update active/deactive children so whole subtree moves consistently
      function updateDescendants(parentId: string) {
        const children = db.prepare('SELECT id, status FROM todos WHERE parent_id = ?').all(parentId) as { id: string; status: TodoStatus }[]
        for (const child of children) {
          if (child.status !== 'completed') {
            db.prepare('UPDATE todos SET status = ? WHERE id = ?').run(target, child.id)
          }
          updateDescendants(child.id)
        }
      }
      updateDescendants(id)
    })

    moveTransaction()
    return true
  })

  ipcMain.handle('todos:delete', (_, id: string): boolean => {
    if (typeof id !== 'string') {
      throw new Error('شناسه نامعتبر است.')
    }

    // ON DELETE CASCADE will clean up nested subtasks
    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id)
    return result.changes > 0
  })
}
