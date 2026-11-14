import { useEffect, useState, useMemo } from 'react'
import type { TodoItem, Cycle } from '@shared/todo.type'
import { TaskTree } from '../../../components/TaskTree'
import { CycleProgressHeader } from '../../../components/CycleProgressHeader'
import { QuickTaskInput } from '../../../components/QuickTaskInput'
import { EditTaskModal } from '../../../components/EditTaskModal'
import { calculateHierarchicalProgress } from '../../../utils/progress'
import { useI18n } from '../../../i18n/I18nContext'
import { Sun, CheckCircle, ListTodo, Globe } from 'lucide-react'

interface HomeProps {
  onNavigateNewCycle: () => void
}

export default function Home({ onNavigateNewCycle }: HomeProps) {
  const { t, locale, setLocale } = useI18n()
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subtask adding state
  const [activeParentForSubtask, setActiveParentForSubtask] = useState<TodoItem | null>(null)

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<TodoItem | null>(null)

  const reloadData = async () => {
    try {
      const [activeCycle, fetchedTodos] = await Promise.all([
        window.api.getActiveCycle(),
        window.api.getTodos()
      ])
      setCycle(activeCycle)
      setTodos(fetchedTodos)
    } catch (err) {
      setError(String(err))
    }
  }

  useEffect(() => {
    reloadData().finally(() => setLoading(false))
  }, [])

  const runMutation = async (mutate: () => Promise<any>) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await mutate()
      const updatedTodos = await window.api.getTodos()
      setTodos(updatedTodos)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
    }
  }

  // Split tasks into sections
  const todayTasks = useMemo(
    () => todos.filter((t) => t.status === 'active' && !t.isCompleted),
    [todos]
  )
  const allTasks = useMemo(
    () => todos.filter((t) => t.status === 'deactive' && !t.isCompleted),
    [todos]
  )
  const completedTasks = useMemo(
    () => todos.filter((t) => t.status === 'completed' || t.isCompleted),
    [todos]
  )

  const progress = useMemo(() => calculateHierarchicalProgress(todos), [todos])

  return (
    <div className="flex h-screen flex-col bg-slate-100 p-4 md:p-6 overflow-hidden select-none">
      {/* Top Header with Cycle Progress & Global Controls */}
      <div className="relative">
        <CycleProgressHeader
          cycle={cycle}
          progress={progress}
          onNewCycleClick={onNavigateNewCycle}
        />

        {/* Language switch button in top corner */}
        <button
          onClick={() => setLocale(locale === 'fa' ? 'en' : 'fa')}
          className="absolute top-3 left-4 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 transition shadow-xs"
        >
          <Globe className="w-3.5 h-3.5 text-sky-500" />
          <span>{locale === 'fa' ? 'English' : 'فارسی'}</span>
        </button>
      </div>

      {/* Main 2-column desktop layout */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-5 min-h-0">
        {/* Column 1: Today's Tasks */}
        <section className="flex flex-col rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80 min-h-0">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-slate-800 text-base">{t('todayTasks')}</h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {todayTasks.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <TaskTree
              tasks={todayTasks}
              mode="today"
              busy={busy}
              onToggle={(task, completed) =>
                runMutation(() => window.api.toggleTodo(task.id, completed))
              }
              onMoveToAll={(task) =>
                runMutation(() => window.api.moveTodo(task.id, 'deactive'))
              }
              onDelete={(task) => runMutation(() => window.api.deleteTodo(task.id))}
              onEdit={(task) => setEditingTask(task)}
              onAddSubtask={(task) => setActiveParentForSubtask(task)}
            />
          </div>

          <QuickTaskInput
            onAdd={(title) =>
              runMutation(async () => {
                const newTask = await window.api.addTodo(title)
                await window.api.moveTodo(newTask.id, 'active')
              })
            }
            placeholder={t('addTaskPlaceholder')}
          />
        </section>

        {/* Column 2: All Tasks & Completed Tasks */}
        <div className="grid grid-rows-2 gap-5 min-h-0">
          {/* Top: All Tasks */}
          <section className="flex flex-col rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80 min-h-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-sky-500" />
                <h2 className="font-bold text-slate-800 text-base">{t('allTasks')}</h2>
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  {allTasks.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <TaskTree
                tasks={allTasks}
                mode="all"
                busy={busy}
                onToggle={(task, completed) =>
                  runMutation(() => window.api.toggleTodo(task.id, completed))
                }
                onMoveToToday={(task) =>
                  runMutation(() => window.api.moveTodo(task.id, 'active'))
                }
                onDelete={(task) => runMutation(() => window.api.deleteTodo(task.id))}
                onEdit={(task) => setEditingTask(task)}
                onAddSubtask={(task) => setActiveParentForSubtask(task)}
              />
            </div>

            <QuickTaskInput
              onAdd={(title) => runMutation(() => window.api.addTodo(title))}
              placeholder={t('addTaskPlaceholder')}
            />
          </section>

          {/* Bottom: Completed Tasks */}
          <section className="flex flex-col rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80 min-h-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <h2 className="font-bold text-slate-800 text-base">{t('completedTasks')}</h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {completedTasks.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <TaskTree
                tasks={completedTasks}
                mode="completed"
                busy={busy}
                onToggle={(task, completed) =>
                  runMutation(() => window.api.toggleTodo(task.id, completed))
                }
                onRestore={(task) =>
                  runMutation(() => window.api.toggleTodo(task.id, false))
                }
                onDelete={(task) => runMutation(() => window.api.deleteTodo(task.id))}
                onEdit={(task) => setEditingTask(task)}
                onAddSubtask={() => {}}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Subtask inline quick adder modal */}
      {activeParentForSubtask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-2">
              {t('addSubtask')} ({activeParentForSubtask.title})
            </h4>
            <QuickTaskInput
              parentId={activeParentForSubtask.id}
              onAdd={async (title, parentId) => {
                await runMutation(() => window.api.addTodo(title, parentId))
                setActiveParentForSubtask(null)
              }}
            />
            <button
              onClick={() => setActiveParentForSubtask(null)}
              className="mt-3 w-full rounded-xl border border-slate-200 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={async (id, title, note) => {
          await runMutation(() => window.api.updateTodo(id, { title, note }))
        }}
      />

      {/* Status & Error Toasts */}
      {(loading || error) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`fixed bottom-5 left-5 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xl transition-all ${
            error ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {error ?? 'در حال بارگذاری...'}
        </div>
      )}
    </div>
  )
}
