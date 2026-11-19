import type { ElectronAPI } from '@electron-toolkit/preload'
import type { TodoItem, Cycle, CreateCycleDTO, TargetType } from '../shared/todo.type'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
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
  }
}

export {}
