import { useEffect, useState, useMemo } from 'react'
import type { TodoItem, Cycle } from '@shared/todo.type'
import { TaskTree } from '../../../components/TaskTree'
import { CycleProgressHeader } from '../../../components/CycleProgressHeader'
import { QuickTaskInput } from '../../../components/QuickTaskInput'
import { EditTaskModal } from '../../../components/EditTaskModal'
import { SettingsSidebar } from '../../../components/SettingsSidebar'
import { calculateHierarchicalProgress } from '../../../utils/progress'
import { useI18n } from '../../../i18n/I18nContext'
import { dataService } from '../../../services/dataService'
import { Sun, CheckCircle, ListTodo } from 'lucide-react'

interface HomeProps {
  onNavigateNewCycle: () => void
}

export default function Home({ onNavigateNewCycle }: HomeProps) {
  const { t } = useI18n()
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeParentForSubtask, setActiveParentForSubtask] = useState<TodoItem | null>(null)
  const [editingTask, setEditingTask] = useState<TodoItem | null>(null)

  const reloadData = async () => {
    try {
      const [activeCycle, fetchedTodos] = await Promise.all([
        dataService.getActiveCycle(),
        dataService.getTodos()
      ])
      setCycle(activeCycle)
      setTodos(fetchedTodos)
      setError(null)
    } catch (err: any) {
      setError(err?.message || String(err))
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
      const updatedTodos = await dataService.getTodos()
      setTodos(updatedTodos)
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  // --- Today Tasks Projection ---
  // In Today's tasks, we include:
  // 1. Any root tasks marked 'active'
  // 2. Any subtasks marked 'active' - structured under their root parent (as a context header)
  const todayTasksTree = useMemo(() => {
    const todayRoots: TodoItem[] = []

    // Helper to find which subtasks under a root are active
    function extractActiveSubtree(item: TodoItem): TodoItem | null {
      const isDirectlyActive = item.status === 'active' && !item.isCompleted
      const filteredChildren: TodoItem[] = []

      if (item.subtasks) {
        for (const child of item.subtasks) {
          const subResult = extractActiveSubtree(child)
          if (subResult) filteredChildren.push(subResult)
        }
      }

      // If this item is active OR any of its descendants are active, include it
      if (isDirectlyActive || filteredChildren.length > 0) {
        return {
          ...item,
          subtasks: filteredChildren
        }
      }
      return null
    }

    for (const root of todos) {
      if (!root.isCompleted && root.status !== 'completed') {
        const subtree = extractActiveSubtree(root)
        if (subtree) todayRoots.push(subtree)
      }
    }

    return todayRoots
  }, [todos])

  // All Tasks: Uncompleted tasks
  const allTasks = useMemo(
    () => todos.filter((t) => !t.isCompleted && t.status !== 'completed'),
    [todos]
  )

  // Completed Tasks:
  const completedTasks = useMemo(
    () => todos.filter((t) => t.status === 'completed' || t.isCompleted),
    [todos]
  )

  const progress = useMemo(() => calculateHierarchicalProgress(todos), [todos])

  return (
    <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950 p-4 md:p-6 overflow-hidden select-none transition-colors">
      <CycleProgressHeader
        cycle={cycle}
        progress={progress}
        onNewCycleClick={onNavigateNewCycle}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main 2-column desktop / 1-column mobile layout */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-5 min-h-0 overflow-y-auto md:overflow-hidden pb-4 md:pb-0">
        {/* Column 1: Today's Tasks */}
        <section className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 min-h-[300px] md:min-h-0 transition-colors">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">{t('todayTasks')}</h2>
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                {todayTasksTree.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <TaskTree
              tasks={todayTasksTree}
              mode="today"
              busy={busy}
              onToggle={(task, completed) =>
                runMutation(() => dataService.toggleTodo(task.id, completed))
              }
              onMoveToAll={(task) =>
                runMutation(() => dataService.moveTodo(task.id, 'deactive'))
              }
              onDelete={(task) => runMutation(() => dataService.deleteTodo(task.id))}
              onEdit={(task) => setEditingTask(task)}
              onAddSubtask={(task) => setActiveParentForSubtask(task)}
              onUpdateValue={(task, delta) =>
                runMutation(() =>
                  dataService.updateTodo(task.id, {
                    currentValue: Math.max(0, (task.currentValue ?? 0) + delta)
                  })
                )
              }
            />
          </div>

          <QuickTaskInput
            onAdd={(title) =>
              runMutation(async () => {
                const newTask = await dataService.addTodo(title)
                await dataService.moveTodo(newTask.id, 'active')
              })
            }
            placeholder={t('addTaskPlaceholder')}
          />
        </section>

        {/* Column 2: All Tasks & Completed Tasks */}
        <div className="grid grid-rows-2 gap-5 min-h-[500px] md:min-h-0">
          {/* Top: All Tasks */}
          <section className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 min-h-0 transition-colors">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-accent-500" />
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">{t('allTasks')}</h2>
                <span className="rounded-full bg-accent-50 dark:bg-accent-500/10 px-2 py-0.5 text-xs font-semibold text-accent-700 dark:text-accent-400">
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
                  runMutation(() => dataService.toggleTodo(task.id, completed))
                }
                onMoveToToday={(task) =>
                  runMutation(() => dataService.moveTodo(task.id, 'active'))
                }
                onDelete={(task) => runMutation(() => dataService.deleteTodo(task.id))}
                onEdit={(task) => setEditingTask(task)}
                onAddSubtask={(task) => setActiveParentForSubtask(task)}
                onUpdateValue={(task, delta) =>
                  runMutation(() =>
                    dataService.updateTodo(task.id, {
                      currentValue: Math.max(0, (task.currentValue ?? 0) + delta)
                    })
                  )
                }
              />
            </div>

            <QuickTaskInput
              onAdd={(title) => runMutation(() => dataService.addTodo(title))}
              placeholder={t('addTaskPlaceholder')}
            />
          </section>

          {/* Bottom: Completed Tasks */}
          <section className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 min-h-0 transition-colors">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">{t('completedTasks')}</h2>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
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
                  runMutation(() => dataService.toggleTodo(task.id, completed))
                }
                onRestore={(task) =>
                  runMutation(() => dataService.toggleTodo(task.id, false))
                }
                onDelete={(task) => runMutation(() => dataService.deleteTodo(task.id))}
                onEdit={(task) => setEditingTask(task)}
                onAddSubtask={() => {}}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Subtask inline quick adder modal */}
      {activeParentForSubtask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
              {t('addSubtask')} ({activeParentForSubtask.title})
            </h4>
            <QuickTaskInput
              parentId={activeParentForSubtask.id}
              onAdd={async (title, parentId) => {
                await runMutation(() => dataService.addTodo(title, parentId))
                setActiveParentForSubtask(null)
              }}
            />
            <button
              onClick={() => setActiveParentForSubtask(null)}
              className="mt-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
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
        onSave={async (id, data) => {
          await runMutation(() => dataService.updateTodo(id, data))
        }}
      />

      <SettingsSidebar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

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
