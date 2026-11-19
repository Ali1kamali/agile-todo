export type TodoStatus = 'completed' | 'active' | 'deactive'
export type TargetType = 'simple' | 'numeric'

export interface TodoItem {
  id: string
  title: string
  isCompleted: boolean
  status: TodoStatus
  createdAt: string
  parentId?: string | null
  cycleId?: string | null
  note?: string
  subtasks?: TodoItem[]

  // Numeric / Habit Target Support
  targetType?: TargetType
  currentValue?: number
  targetValue?: number
  unit?: string
}

export type CycleDurationType = 'days' | 'months' | 'dates'

export interface Cycle {
  id: string
  title: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  durationDays: number
  status: 'active' | 'archived'
  createdAt: string
}

export interface CreateCycleDTO {
  title: string
  startDate: string
  endDate: string
  tasks: Array<{
    title: string
    note?: string
    targetType?: TargetType
    currentValue?: number
    targetValue?: number
    unit?: string
    subtasks?: Array<{
      title: string
      note?: string
      targetType?: TargetType
      currentValue?: number
      targetValue?: number
      unit?: string
      subtasks?: any[]
    }>
  }>
  transferUnfinishedTasks?: boolean
}
