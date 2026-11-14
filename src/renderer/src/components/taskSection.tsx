import type { ReactNode } from 'react'
import type { TodoItem, TodoStatus } from '@shared'
import { TodoList, type TodoListProps } from './TodoList'

type TaskSectionProps = Omit<TodoListProps, 'todos'> & {
  todos: readonly TodoItem[]
  status: TodoStatus
  title: string
  emptyMessage: string
}

/**
 * فیلتر کردن درخت به گونه‌ای که:
 * ۱. در لیست کارهای روزانه یا همه کارها: اگر والد در این لیست باشد، تمام زیرکارهایش
 *    (حتی آن‌هایی که انجام شده‌اند) زیر خودش نمایش داده می‌شوند تا خط‌خورده بمانند.
 * ۲. اگر والد انجام شده باشد ولی فرزند انجام‌نشده داشته باشد، آن فرزند به لیست مناسب خود منتقل می‌شود.
 */
function filterTree(todos: readonly TodoItem[], status: TodoStatus): TodoItem[] {
  return todos.flatMap((todo) => {
    // اگر لیست «انجام‌شده‌ها» است:
    if (status === 'completed') {
      const completedChildren = filterTree(todo.subtasks ?? [], 'completed')

      // اگر خود والد تکمیل شده، با فرزندان تکمیل‌شده‌اش بیاید
      if (todo.status === 'completed' || todo.isCompleted) {
        return [{ ...todo, subtasks: completedChildren }]
      }

      // اگر والد تکمیل نشده ولی زیرکارش تکمیل شده، آن زیرکار در لیست تکمیل‌شده‌ها بالا بیاید
      return completedChildren
    }

    // برای لیست‌های «کارهای امروز (active)» و «همه کارها (deactive)»:
    if (todo.status === status) {
      // خود والد متعلق به این بخش است؛ زیرکارهایش حفظ می‌شوند تا وضعیتشان (تیک‌خورده/نخورده) دیده شود
      return [todo]
    }

    // اگر والد متعلق به این بخش نیست، شاید فرزندی داشته باشد که وضعیتش متعلق به این بخش باشد
    return filterTree(todo.subtasks ?? [], status)
  })
}

export function TaskSection({
  todos,
  status,
  title,
  emptyMessage,
  ...listProps
}: TaskSectionProps) {
  const visibleTodos = filterTree(todos, status)

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>

      {visibleTodos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <TodoList todos={visibleTodos} {...listProps} />
      )}
    </section>
  )
}

type IconActionProps = {
  label: string
  icon: 'toToday' | 'toAll' | 'restore'
  disabled?: boolean
  onClick: () => void | Promise<void>
}

export function IconAction({ label, icon, disabled = false, onClick }: IconActionProps): ReactNode {
  const paths = {
    toToday: 'M5 12h14m0 0-6-6m6 6-6 6',
    toAll: 'M19 12H5m0 0 6-6m-6 6 6 6',
    restore: 'M3 11a9 9 0 1 1 2.6 6.4M3 17v-6h6'
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={() => void onClick()}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
        className="size-4"
      >
        <path d={paths[icon]} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
