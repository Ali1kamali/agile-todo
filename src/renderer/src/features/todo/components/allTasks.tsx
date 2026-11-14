import type { TodoItem } from '../../../../shared/todo.type'
import { IconAction, TaskSection } from './TaskSection'
import type { TodoListProps } from './TodoList'

type AllTasksProps = Omit<TodoListProps, 'renderAction'> & {
  onMoveToToday?: (todo: TodoItem) => void | Promise<void>
}

export function AllTasks({ onMoveToToday, busy, ...props }: AllTasksProps) {
  return (
    <TaskSection
      {...props}
      busy={busy}
      status="deactive"
      title="همهٔ کارها"
      emptyMessage="کاری در این لیست نیست."
      renderAction={
        onMoveToToday
          ? (todo) => (
              <IconAction
                label={`انتقال ${todo.title} به امروز`}
                icon="toToday"
                disabled={busy}
                onClick={() => onMoveToToday(todo)}
              />
            )
          : undefined
      }
    />
  )
}
