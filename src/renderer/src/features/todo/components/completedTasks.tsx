import type { TodoItem } from '../../../../shared/todo.type'
import { IconAction, TaskSection } from './TaskSection'
import type { TodoListProps } from './TodoList'

type CompletedTasksProps = Omit<TodoListProps, 'renderAction' | 'onToggle' | 'showCheckbox'> & {
  onRestore?: (todo: TodoItem) => void | Promise<void>
}

export function CompletedTasks({ onRestore, busy, ...props }: CompletedTasksProps) {
  return (
    <TaskSection
      {...props}
      busy={busy}
      status="completed"
      title="انجام‌شده‌ها"
      emptyMessage="هنوز کاری انجام نشده است."
      showCheckbox={false}
      renderAction={
        onRestore
          ? (todo) => (
              <IconAction
                label={`بازگرداندن ${todo.title} به لیست قبلی`}
                icon="restore"
                disabled={busy}
                onClick={() => onRestore(todo)}
              />
            )
          : undefined
      }
    />
  )
}
