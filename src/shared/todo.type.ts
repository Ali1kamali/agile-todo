export type TodoStatus = 'completed' | 'active' | 'deactive'
export interface TodoItem {
  id: string
  title: string
  isCompleted: boolean
  status: TodoStatus
  createdAt: string
  subtasks?: TodoItem[]
  note?: string
}
