// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import type { TodoItem } from '../shared/todo.type'

const api = {
  getTodos: (): Promise<TodoItem[]> => ipcRenderer.invoke('todos:getAll'),

  addTodo: (title: string, parentId?: string): Promise<TodoItem> =>
    ipcRenderer.invoke('todos:add', title, parentId),

  toggleTodo: (id: string, completed: boolean): Promise<boolean> =>
    ipcRenderer.invoke('todos:toggle', id, completed),

  moveTodo: (id: string, target: 'active' | 'deactive'): Promise<boolean> =>
    ipcRenderer.invoke('todos:move', id, target),

  deleteTodo: (id: string): Promise<boolean> => ipcRenderer.invoke('todos:delete', id)
}

contextBridge.exposeInMainWorld('api', api)
