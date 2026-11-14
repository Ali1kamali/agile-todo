import { useEffect, useState } from 'react'
import type { TodoItem } from '../../../shared/todo.type'
import { AllTasks } from '../components/todos/allTasks'
import { CompletedTasks } from '../components/todos/completedTasks'
import { TodayTasks } from '../components/todos/todayTasks'

export default function Home() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    window.api
      .getTodos()
      .then((data) => {
        if (!cancelled) setTodos(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function runMutation(mutate: () => Promise<boolean>) {
    if (busy) return

    setBusy(true)
    setError(null)

    try {
      const changed = await mutate()

      if (!changed) {
        throw new Error('تغییر در دیتابیس ذخیره نشد.')
      }

      // بعد از هر تغییر، دادهٔ نهایی را از SQLite می‌خوانیم.
      setTodos(await window.api.getTodos())
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  const sharedProps = {
    todos,
    busy,
    showCheckbox: true,
    showExpandArrow: true,
    onToggle: (todo: TodoItem, completed: boolean) =>
      runMutation(() => window.api.toggleTodo(todo.id, completed))
  }

  return (
    <main
      dir="rtl"
      className="grid h-screen min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 overflow-hidden bg-slate-100 p-5"
    >
      {/* ستون اول در چیدمان RTL، سمت راست است. */}
      <div className="min-h-0 overflow-y-auto rounded-2xl bg-slate-50 p-4">
        <TodayTasks
          {...sharedProps}
          onMoveToAll={(todo) => runMutation(() => window.api.moveTodo(todo.id, 'deactive'))}
        />
      </div>

      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 rounded-2xl bg-slate-50 p-4">
        <div className="min-h-0 overflow-y-auto">
          <AllTasks
            {...sharedProps}
            onMoveToToday={(todo) => runMutation(() => window.api.moveTodo(todo.id, 'active'))}
          />
        </div>

        <hr className="border-slate-200" />

        <div className="min-h-0 overflow-y-auto">
          <CompletedTasks
            todos={todos}
            busy={busy}
            showExpandArrow
            onRestore={(todo) => runMutation(() => window.api.toggleTodo(todo.id, false))}
          />
        </div>
      </div>

      {(loading || error) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`fixed bottom-5 left-5 rounded-xl px-4 py-2 text-sm shadow-lg ${
            error ? 'bg-red-50 text-red-700' : 'bg-slate-800 text-white'
          }`}
        >
          {error ?? 'در حال دریافت کارها...'}
        </div>
      )}
    </main>
  )
}
