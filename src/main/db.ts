import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const dbPath = join(app.getPath('userData'), 'todos.db')

export const db: DatabaseType = new Database(dbPath)

//* WAL mode
db.pragma('journal_mode = WAL')

export function initDatabase(): void {
  const query = `
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'deactive'
        CHECK (status IN ('active', 'deactive', 'completed')),
      created_at TEXT NOT NULL,
      parent_id TEXT REFERENCES todos(id) ON DELETE CASCADE,
      previous_status TEXT
        CHECK (previous_status IN ('active', 'deactive')
              OR previous_status IS NULL)
    );
  `
  db.exec(query)
}
