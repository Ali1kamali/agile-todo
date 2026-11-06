import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getTodos: () => ipcRenderer.invoke('todos:getAll'),
  addTodo: (title: string) => ipcRenderer.invoke('todos:add', title),
  toggleTodo: (id: number, completed: boolean) => ipcRenderer.invoke('todos:toggle', id, completed),
  deleteTodo: (id: number) => ipcRenderer.invoke('todos:delete', id)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
