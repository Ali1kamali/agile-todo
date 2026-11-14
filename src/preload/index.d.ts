// src/renderer/src/env.d.ts
import type { TodoItem } from '../../shared/todo.type'

declare global {
  interface Window {
    api: {
      getTodos(): Promise<TodoItem[]>
      addTodo(title: string, parentId?: string): Promise<TodoItem>
      toggleTodo(id: string, completed: boolean): Promise<boolean>
      moveTodo(id: string, target: 'active' | 'deactive'): Promise<boolean>
      deleteTodo(id: string): Promise<boolean>
    }
  }
}

export {}
