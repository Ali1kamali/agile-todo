import { ipcMain } from 'electron'
import { db } from './db'

export function registerTodoHandlers(): void {
  ipcMain.handle('todos:getAll', () => {
    const stmt = db.prepare('SELECT * FROM todos ORDER BY id DESC')
    return stmt.all()
  })

  ipcMain.handle('todos:add', (_, title: string) => {
    const stmt = db.prepare('INSERT INTO todos (title) VALUES (?)')
    const result = stmt.run(title)
    return { id: result.lastInsertRowid, title, completed: 0 }
  })

  ipcMain.handle('todos:toggle', (_, id: number, completed: boolean) => {
    const stmt = db.prepare('UPDATE todos SET completed = ? WHERE id = ?')
    stmt.run(completed ? 1 : 0, id)
    return true
  })

  ipcMain.handle('todos:delete', (_, id: number) => {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?')
    stmt.run(id)
    return true
  })
}
