import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import type { TodoItem, Cycle, CreateCycleDTO, TodoStatus, TargetType } from '@shared/todo.type'

export interface IDataService {
  getActiveCycle(): Promise<Cycle | null>
  getAllCycles(): Promise<Cycle[]>
  createCycle(dto: CreateCycleDTO): Promise<Cycle>
  getTodos(cycleId?: string): Promise<TodoItem[]>
  addTodo(
    title: string,
    parentId?: string,
    note?: string,
    targetType?: TargetType,
    targetValue?: number,
    unit?: string
  ): Promise<TodoItem>
  updateTodo(
    id: string,
    data: {
      title?: string
      note?: string
      targetType?: TargetType
      currentValue?: number
      targetValue?: number
      unit?: string
    }
  ): Promise<boolean>
  toggleTodo(id: string, completed: boolean): Promise<boolean>
  moveTodo(id: string, target: 'active' | 'deactive'): Promise<boolean>
  deleteTodo(id: string): Promise<boolean>
}

// -------------------------------------------------------------
// 1. Electron Desktop Adapter
// -------------------------------------------------------------
class ElectronDataService implements IDataService {
  getActiveCycle(): Promise<Cycle | null> {
    return window.api.getActiveCycle()
  }
  getAllCycles(): Promise<Cycle[]> {
    return window.api.getAllCycles()
  }
  createCycle(dto: CreateCycleDTO): Promise<Cycle> {
    return window.api.createCycle(dto)
  }
  getTodos(cycleId?: string): Promise<TodoItem[]> {
    return window.api.getTodos(cycleId)
  }
  addTodo(
    title: string,
    parentId?: string,
    note?: string,
    targetType?: TargetType,
    targetValue?: number,
    unit?: string
  ): Promise<TodoItem> {
    return window.api.addTodo(title, parentId, note, targetType, targetValue, unit)
  }
  updateTodo(
    id: string,
    data: {
      title?: string
      note?: string
      targetType?: TargetType
      currentValue?: number
      targetValue?: number
      unit?: string
    }
  ): Promise<boolean> {
    return window.api.updateTodo(id, data)
  }
  toggleTodo(id: string, completed: boolean): Promise<boolean> {
    return window.api.toggleTodo(id, completed)
  }
  moveTodo(id: string, target: 'active' | 'deactive'): Promise<boolean> {
    return window.api.moveTodo(id, target)
  }
  deleteTodo(id: string): Promise<boolean> {
    return window.api.deleteTodo(id)
  }
}

// -------------------------------------------------------------
// 2. Mobile Adapter (Capacitor SQLite for Android & iOS)
// -------------------------------------------------------------
class MobileDataService implements IDataService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite)
  private dbName: string = 'agile_todo_mobile'
  private initialized: boolean = false

  private async getDB() {
    const isConn = (await this.sqlite.isConnection(this.dbName, false)).result
    let db = isConn
      ? await this.sqlite.retrieveConnection(this.dbName, false)
      : await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false)

    await db.open()

    if (!this.initialized) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS cycles (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          duration_days INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          is_completed INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'deactive'
            CHECK (status IN ('active', 'deactive', 'completed')),
          created_at TEXT NOT NULL,
          parent_id TEXT REFERENCES todos(id) ON DELETE CASCADE,
          cycle_id TEXT REFERENCES cycles(id) ON DELETE SET NULL,
          previous_status TEXT
            CHECK (previous_status IN ('active', 'deactive') OR previous_status IS NULL),
          note TEXT,
          target_type TEXT DEFAULT 'simple',
          current_value REAL DEFAULT 0,
          target_value REAL,
          unit TEXT
        );
      `)

      this.initialized = true
    }

    return db
  }

  async getActiveCycle(): Promise<Cycle | null> {
    const db = await this.getDB()
    const res = await db.query("SELECT * FROM cycles WHERE status = 'active' ORDER BY created_at DESC LIMIT 1")
    if (!res.values || res.values.length === 0) return null
    const row = res.values[0]
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

  async getAllCycles(): Promise<Cycle[]> {
    const db = await this.getDB()
    const res = await db.query('SELECT * FROM cycles ORDER BY created_at DESC')
    return (res.values || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      startDate: row.start_date,
      endDate: row.end_date,
      durationDays: row.duration_days,
      status: row.status,
      createdAt: row.created_at
    }))
  }

  async createCycle(dto: CreateCycleDTO): Promise<Cycle> {
    const db = await this.getDB()
    const newCycleId = crypto.randomUUID()
    const nowIso = new Date().toISOString()
    const start = new Date(dto.startDate).getTime()
    const end = new Date(dto.endDate).getTime()
    const durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24))

    await db.run("UPDATE cycles SET status = 'archived' WHERE status = 'active'")
    await db.run(
      `INSERT INTO cycles (id, title, start_date, end_date, duration_days, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [newCycleId, dto.title.trim(), dto.startDate, dto.endDate, durationDays, nowIso]
    )

    if (dto.transferUnfinishedTasks) {
      await db.run("UPDATE todos SET cycle_id = ? WHERE status IN ('active', 'deactive')", [newCycleId])
    }

    const insertTasks = async (task: any, parentId: string | null = null) => {
      if (!task.title?.trim()) return
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      await db.run(
        `INSERT INTO todos (id, title, is_completed, status, created_at, parent_id, cycle_id, note, target_type, current_value, target_value, unit)
         VALUES (?, ?, 0, 'deactive', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          task.title.trim(),
          createdAt,
          parentId,
          newCycleId,
          task.note?.trim() || null,
          task.targetType || 'simple',
          task.currentValue ?? 0,
          task.targetValue ?? null,
          task.unit?.trim() || null
        ]
      )
      if (Array.isArray(task.subtasks)) {
        for (const sub of task.subtasks) {
          await insertTasks(sub, id)
        }
      }
    }

    if (Array.isArray(dto.tasks)) {
      for (const t of dto.tasks) {
        await insertTasks(t)
      }
    }

    return {
      id: newCycleId,
      title: dto.title.trim(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      durationDays,
      status: 'active',
      createdAt: nowIso
    }
  }

  async getTodos(cycleId?: string): Promise<TodoItem[]> {
    const db = await this.getDB()
    let cid = cycleId
    if (!cid) {
      const active = await this.getActiveCycle()
      cid = active ? active.id : undefined
    }

    const res = cid
      ? await db.query('SELECT * FROM todos WHERE cycle_id = ? ORDER BY created_at ASC', [cid])
      : await db.query('SELECT * FROM todos ORDER BY created_at ASC')

    const rows = res.values || []
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
  }

  async addTodo(
    title: string,
    parentId?: string,
    note?: string,
    targetType: TargetType = 'simple',
    targetValue?: number,
    unit?: string
  ): Promise<TodoItem> {
    const db = await this.getDB()
    const active = await this.getActiveCycle()
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const status: TodoStatus = 'deactive'
    const cycleId = active ? active.id : null

    await db.run(
      `INSERT INTO todos (id, title, is_completed, status, created_at, parent_id, cycle_id, note, target_type, current_value, target_value, unit)
       VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, title.trim(), status, createdAt, parentId ?? null, cycleId, note?.trim() || null, targetType, targetValue ?? null, unit?.trim() || null]
    )

    return {
      id,
      title: title.trim(),
      isCompleted: false,
      status,
      createdAt,
      parentId: parentId ?? null,
      cycleId,
      note: note?.trim() || undefined,
      targetType,
      currentValue: 0,
      targetValue: targetValue ?? undefined,
      unit: unit?.trim() || undefined,
      subtasks: []
    }
  }

  async updateTodo(
    id: string,
    data: {
      title?: string
      note?: string
      targetType?: TargetType
      currentValue?: number
      targetValue?: number
      unit?: string
    }
  ): Promise<boolean> {
    const db = await this.getDB()
    const updates: string[] = []
    const params: any[] = []

    if (data.title !== undefined) {
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
    }
    if (data.targetValue !== undefined) {
      updates.push('target_value = ?')
      params.push(data.targetValue)
    }
    if (data.unit !== undefined) {
      updates.push('unit = ?')
      params.push(data.unit.trim() || null)
    }

    if (updates.length > 0) {
      params.push(id)
      await db.run(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`, params)
    }
    return true
  }

  async toggleTodo(id: string, completed: boolean): Promise<boolean> {
    const db = await this.getDB()
    if (completed) {
      await db.run("UPDATE todos SET previous_status = status, status = 'completed', is_completed = 1 WHERE id = ?", [id])
    } else {
      await db.run("UPDATE todos SET status = COALESCE(previous_status, 'deactive'), previous_status = NULL, is_completed = 0 WHERE id = ?", [id])
    }
    return true
  }

  async moveTodo(id: string, target: 'active' | 'deactive'): Promise<boolean> {
    const db = await this.getDB()
    await db.run('UPDATE todos SET status = ?, is_completed = 0 WHERE id = ?', [target, id])
    return true
  }

  async deleteTodo(id: string): Promise<boolean> {
    const db = await this.getDB()
    await db.run('DELETE FROM todos WHERE id = ?', [id])
    return true
  }
}

// -------------------------------------------------------------
// 3. Universal Factory
// -------------------------------------------------------------
const isNativeMobile = Capacitor.isNativePlatform()
export const dataService: IDataService = isNativeMobile
  ? new MobileDataService()
  : new ElectronDataService()
