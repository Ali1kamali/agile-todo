import { randomUUID } from 'node:crypto'
import { ipcMain } from 'electron'
import { db } from './db'
import type { TodoItem, TodoStatus, Cycle, CreateCycleDTO, TargetType } from '../shared/todo.type'

type TodoRow = {
  id: string
  title: string
  is_completed: number
  status: TodoStatus
  created_at: string
  parent_id: string | null
  cycle_id: string | null
  note: string | null
  target_type: TargetType | null
  current_value: number | null
  target_value: number | null
  unit: string | null
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

    const durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
    if (durationDays > 186) {
      throw new Error('مدت زمان دوره نمی‌تواند بیشتر از ۶ ماه باشد.')
    }

    const newCycleId = randomUUID()
    const nowIso = new Date().toISOString()

    const createTransaction = db.transaction(() => {
      const currentActive = db.prepare("SELECT id FROM cycles WHERE status = 'active'").all() as { id: string }[]

      db.prepare("UPDATE cycles SET status = 'archived' WHERE status = 'active'").run()

      db.prepare(`
        INSERT INTO cycles (id, title, start_date, end_date, duration_days, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
      `).run(newCycleId, dto.title.trim(), dto.startDate, dto.endDate, durationDays, nowIso)

      if (dto.transferUnfinishedTasks && currentActive.length > 0) {
        const activeIds = currentActive.map((c) => c.id)
        const placeholders = activeIds.map(() => '?').join(',')

        db.prepare(`
          UPDATE todos
          SET cycle_id = ?
          WHERE cycle_id IN (${placeholders})
            AND status IN ('active', 'deactive')
        `).run(newCycleId, ...activeIds)

        db.prepare(`
          UPDATE todos
          SET cycle_id = ?
          WHERE parent_id IN (SELECT id FROM todos WHERE cycle_id = ?)
        `).run(newCycleId, newCycleId)
      }

      function insertTaskTree(
        task: any,
        parentId: string | null = null
      ) {
        if (!task.title?.trim()) return
        const taskId = randomUUID()
        const createdAt = new Date().toISOString()

        db.prepare(`
          INSERT INTO todos (id, title, is_completed, status, created_at, parent_id, cycle_id, note, target_type, current_value, target_value, unit)
          VALUES (?, ?, 0, 'deactive', ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          taskId,
          task.title.trim(),
          createdAt,
          parentId,
          newCycleId,
          task.note?.trim() || null,
          task.targetType || 'simple',
          task.currentValue ?? 0,
          task.targetValue ?? null,
          task.unit?.trim() || null
        )

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
        SELECT id, title, is_completed, status, created_at, parent_id, cycle_id, note, target_type, current_value, target_value, unit
        FROM todos
        WHERE cycle_id = ?
        ORDER BY created_at ASC, id ASC
      `).all(cycleId) as TodoRow[]
    } else {
      const activeCycle = db.prepare("SELECT id FROM cycles WHERE status = 'active' LIMIT 1").get() as { id: string } | undefined
      if (activeCycle) {
        rows = db.prepare(`
          SELECT id, title, is_completed, status, created_at, parent_id, cycle_id, note, target_type, current_value, target_value, unit
          FROM todos
          WHERE cycle_id = ?
          ORDER BY created_at ASC, id ASC
        `).all(activeCycle.id) as TodoRow[]
      } else {
        rows = db.prepare(`
          SELECT id, title, is_completed, status, created_at, parent_id, cycle_id, note, target_type, current_value, target_value, unit
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
        targetType: row.target_type || 'simple',
        currentValue: row.current_value ?? 0,
        targetValue: row.target_value ?? undefined,
        unit: row.unit ?? undefined,
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

  ipcMain.handle(
    'todos:add',
    (
      _,
      title: string,
      parentId?: string,
      note?: string,
      targetType: TargetType = 'simple',
      targetValue?: number,
      unit?: string
    ): TodoItem => {
      if (typeof title !== 'string' || !title.trim()) {
        throw new Error('عنوان کار معتبر نیست.')
      }

      let status: 'active' | 'deactive' = 'deactive'
      let cycleId: string | null = null

      if (parentId) {
        const parent = db.prepare('SELECT status, cycle_id FROM todos WHERE id = ?').get(parentId) as
          { status: TodoStatus; cycle_id: string | null } | undefined

        if (!parent) throw new Error('کار والد پیدا نشد.')
        cycleId = parent.cycle_id
      } else {
        const activeCycle = db.prepare("SELECT id FROM cycles WHERE status = 'active' LIMIT 1").get() as { id: string } | undefined
        cycleId = activeCycle ? activeCycle.id : null
      }

      const id = randomUUID()
      const createdAt = new Date().toISOString()
      const cleanTitle = title.trim()
      const cleanNote = note?.trim() || null
      const cleanUnit = unit?.trim() || null

      db.prepare(`
        INSERT INTO todos (id, title, is_completed, status, created_at, parent_id, cycle_id, note, target_type, current_value, target_value, unit)
        VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(id, cleanTitle, status, createdAt, parentId ?? null, cycleId, cleanNote, targetType, targetValue ?? null, cleanUnit)

      return {
        id,
        title: cleanTitle,
        isCompleted: false,
        status,
        createdAt,
        parentId: parentId ?? null,
        cycleId,
        note: cleanNote ?? undefined,
        targetType,
        currentValue: 0,
        targetValue: targetValue ?? undefined,
        unit: cleanUnit ?? undefined,
        subtasks: []
      }
    }
  )

  ipcMain.handle(
    'todos:update',
    (
      _,
      id: string,
      data: {
        title?: string
        note?: string
        targetType?: TargetType
        currentValue?: number
        targetValue?: number
        unit?: string
      }
    ): boolean => {
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

      if (data.targetType !== undefined) {
        updates.push('target_type = ?')
        params.push(data.targetType)
      }

      if (data.currentValue !== undefined) {
        updates.push('current_value = ?')
        params.push(data.currentValue)

        // Check if numeric target is reached
        const currentTask = db.prepare('SELECT target_type, target_value FROM todos WHERE id = ?').get(id) as any
        const targetVal = data.targetValue !== undefined ? data.targetValue : currentTask?.target_value
        const isNumeric = (data.targetType || currentTask?.target_type) === 'numeric'

        if (isNumeric && targetVal && data.currentValue >= targetVal) {
          updates.push('is_completed = 1')
          updates.push("status = 'completed'")
        }
      }

      if (data.targetValue !== undefined) {
        updates.push('target_value = ?')
        params.push(data.targetValue)
      }

      if (data.unit !== undefined) {
        updates.push('unit = ?')
        params.push(data.unit.trim() || null)
      }

      if (updates.length === 0) return true

      params.push(id)
      const result = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`).run(...params)
      return result.changes > 0
    }
  )

  ipcMain.handle('todos:toggle', (_, id: string, completed: boolean): boolean => {
    if (typeof id !== 'string' || typeof completed !== 'boolean') {
      throw new Error('ورودی نامعتبر است.')
    }

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

    // Single item move (does not forcibly move subtasks when a child is moved to today)
    const result = db.prepare(`
      UPDATE todos
      SET status = ?, is_completed = 0
      WHERE id = ?
    `).run(target, id)

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
