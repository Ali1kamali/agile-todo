import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { TodoItem, Cycle, CreateCycleDTO, TargetType } from '../shared/todo.type'

export const api = {
  getActiveCycle: (): Promise<Cycle | null> => ipcRenderer.invoke('cycles:getActive'),
  getAllCycles: (): Promise<Cycle[]> => ipcRenderer.invoke('cycles:getAll'),
  createCycle: (dto: CreateCycleDTO): Promise<Cycle> => ipcRenderer.invoke('cycles:create', dto),

  getTodos: (cycleId?: string): Promise<TodoItem[]> => ipcRenderer.invoke('todos:getAll', cycleId),
  addTodo: (
    title: string,
    parentId?: string,
    note?: string,
    targetType?: TargetType,
    targetValue?: number,
    unit?: string
  ): Promise<TodoItem> =>
    ipcRenderer.invoke('todos:add', title, parentId, note, targetType, targetValue, unit),
  updateTodo: (
    id: string,
    data: {
      title?: string
      note?: string
      targetType?: TargetType
      currentValue?: number
      targetValue?: number
      unit?: string
    }
  ): Promise<boolean> => ipcRenderer.invoke('todos:update', id, data),
  toggleTodo: (id: string, completed: boolean): Promise<boolean> =>
    ipcRenderer.invoke('todos:toggle', id, completed),
  moveTodo: (id: string, target: 'active' | 'deactive'): Promise<boolean> =>
    ipcRenderer.invoke('todos:move', id, target),
  deleteTodo: (id: string): Promise<boolean> => ipcRenderer.invoke('todos:delete', id)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
