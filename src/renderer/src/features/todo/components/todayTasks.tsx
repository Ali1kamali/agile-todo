import type { TodoItem } from '../../../../shared/todo.type'
import { IconAction, TaskSection } from './TaskSection'
import type { TodoListProps } from './TodoList'

type TodayTasksProps = Omit<TodoListProps, 'renderAction'> & {
  onMoveToAll?: (todo: TodoItem) => void | Promise<void>
}

export function TodayTasks({ onMoveToAll, busy, ...props }: TodayTasksProps) {
  return (
    <TaskSection
      {...props}
      busy={busy}
      status="active"
      title="کارهای امروز"
      emptyMessage="کاری برای امروز انتخاب نشده است."
      renderAction={
        onMoveToAll
          ? (todo) => (
              <IconAction
                label={`انتقال ${todo.title} به همهٔ کارها`}
                icon="toAll"
                disabled={busy}
                onClick={() => onMoveToAll(todo)}
              />
            )
          : undefined
      }
    />
  )
}
