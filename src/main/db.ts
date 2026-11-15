import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const dbPath = join(app.getPath('userData'), 'todos.db')

export const db: DatabaseType = new Database(dbPath)

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase(): void {
  // 1. Schema versioning table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `)

  // 2. Cycles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cycles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
      created_at TEXT NOT NULL
    );
  `)

  // 3. Robust migration for todos table
  // Check existing columns
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='todos'").get()
  
  if (tableCheck) {
    const todoCols = db.prepare("PRAGMA table_info('todos')").all() as { name: string; type: string }[]
    const colNames = new Set(todoCols.map((c) => c.name))

    // If existing table has the legacy structure (e.g., 'completed' instead of 'is_completed' or INTEGER id)
    if (!colNames.has('is_completed') || !colNames.has('status') || !colNames.has('parent_id')) {
      db.transaction(() => {
        // Create new standardized table
        db.exec(`
          CREATE TABLE IF NOT EXISTS todos_new (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            is_completed INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'deactive'
              CHECK (status IN ('active', 'deactive', 'completed')),
            created_at TEXT NOT NULL,
            parent_id TEXT REFERENCES todos_new(id) ON DELETE CASCADE,
            cycle_id TEXT REFERENCES cycles(id) ON DELETE SET NULL,
            previous_status TEXT
              CHECK (previous_status IN ('active', 'deactive') OR previous_status IS NULL),
            note TEXT
          );
        `)

        // Migrate existing rows if any
        try {
          const legacyRows = db.prepare('SELECT * FROM todos').all() as any[]
          const insertStmt = db.prepare(`
            INSERT INTO todos_new (id, title, is_completed, status, created_at, parent_id, cycle_id, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)

          for (const row of legacyRows) {
            const isCompleted = row.is_completed ?? (row.completed ? 1 : 0)
            const status = row.status ?? (isCompleted ? 'completed' : 'deactive')
            const id = String(row.id)
            const parentId = row.parent_id ? String(row.parent_id) : null
            const createdAt = row.created_at || new Date().toISOString()
            const cycleId = row.cycle_id || null
            const note = row.note || null

            insertStmt.run(id, row.title, isCompleted, status, createdAt, parentId, cycleId, note)
          }
        } catch (e) {
          console.error('Migration data copy warning:', e)
        }

        // Drop old table and rename new table
        db.exec('DROP TABLE todos;')
        db.exec('ALTER TABLE todos_new RENAME TO todos;')
      })()
    } else {
      // Ensure missing nullable columns like cycle_id and note exist
      if (!colNames.has('cycle_id')) {
        try {
          db.exec('ALTER TABLE todos ADD COLUMN cycle_id TEXT REFERENCES cycles(id) ON DELETE SET NULL;')
        } catch {}
      }
      if (!colNames.has('note')) {
        try {
          db.exec('ALTER TABLE todos ADD COLUMN note TEXT;')
        } catch {}
      }
    }
  } else {
    // Fresh create
    db.exec(`
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
        note TEXT
      );
    `)
  }

  // 4. Ensure there is at least an initial active cycle
  const activeCycle = db.prepare("SELECT id FROM cycles WHERE status = 'active' LIMIT 1").get()
  if (!activeCycle) {
    const defaultCycleId = 'default-cycle'
    const now = new Date()
    const startDate = now.toISOString().slice(0, 10)
    const end = new Date(now)
    end.setMonth(end.getMonth() + 3) // 3 months default
    const endDate = end.toISOString().slice(0, 10)
    const durationDays = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    db.prepare(`
      INSERT OR IGNORE INTO cycles (id, title, start_date, end_date, duration_days, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).run(defaultCycleId, 'دوره ۳ ماهه رشد فردی', startDate, endDate, durationDays, now.toISOString())

    // Associate existing orphan todos with this cycle
    db.prepare('UPDATE todos SET cycle_id = ? WHERE cycle_id IS NULL').run(defaultCycleId)
  }
}
