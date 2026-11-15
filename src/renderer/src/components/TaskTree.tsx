import React, { useState } from 'react'
import type { TodoItem } from '@shared/todo.type'
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Sun,
  ListTodo,
  Undo2,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react'
import { cn } from '@renderer/utils/cn'
import { useI18n } from '@renderer/i18n/I18nContext'
import Swal from 'sweetalert2'

interface TaskTreeProps {
  tasks: TodoItem[]
  mode: 'all' | 'today' | 'completed'
  busy: boolean
  onToggle: (todo: TodoItem, completed: boolean) => Promise<void>
  onMoveToToday?: (todo: TodoItem) => Promise<void>
  onMoveToAll?: (todo: TodoItem) => Promise<void>
  onRestore?: (todo: TodoItem) => Promise<void>
  onDelete: (todo: TodoItem) => Promise<void>
  onEdit: (todo: TodoItem) => void
  onAddSubtask: (parent: TodoItem) => void
  level?: number
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  tasks,
  mode,
  busy,
  onToggle,
  onMoveToToday,
  onMoveToAll,
  onRestore,
  onDelete,
  onEdit,
  onAddSubtask,
  level = 0
}) => {
  const { t, dir } = useI18n()
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({})

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDeleteWithSwal = async (task: TodoItem, e: React.MouseEvent) => {
    e.stopPropagation()

    const isDarkMode = document.documentElement.classList.contains('dark')

    const result = await Swal.fire({
      title: t('deleteConfirmTitle'),
      text: t('deleteConfirmText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('yesDelete'),
      cancelButtonText: t('cancelDelete'),
      background: isDarkMode ? '#0f172a' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#0f172a'
    })

    if (result.isConfirmed) {
      await onDelete(task)
    }
  }

  if (!tasks || tasks.length === 0) {
    if (level === 0) {
      return (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
          {mode === 'all' && t('noTasks')}
          {mode === 'today' && t('noTodayTasks')}
          {mode === 'completed' && t('noCompletedTasks')}
        </div>
      )
    }
    return null
  }

  return (
    <ul
      className={cn(
        'space-y-1.5',
        level > 0 &&
          (dir === 'rtl'
            ? 'mr-4 border-r border-slate-200 dark:border-slate-800 pr-2 mt-1'
            : 'ml-4 border-l border-slate-200 dark:border-slate-800 pl-2 mt-1')
      )}
    >
      {tasks.map((task) => {
        const hasChildren = task.subtasks && task.subtasks.length > 0
        const isCollapsed = !!collapsedMap[task.id]
        const isCompleted = task.isCompleted || task.status === 'completed'

        return (
          <li key={task.id} className="group relative">
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl p-2.5 transition-all text-sm select-none border',
                isCompleted
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/60 text-slate-400 dark:text-slate-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-accent-500 hover:shadow-xs text-slate-800 dark:text-slate-200'
              )}
            >
              {/* Expand / Collapse Button */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleCollapse(task.id, e)}
                  className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className={cn('w-4 h-4', dir === 'rtl' && 'rotate-180')} />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="w-5" />
              )}

              {/* Checkbox / Completion Toggle */}
              <button
                type="button"
                disabled={busy}
                onClick={() => onToggle(task, !isCompleted)}
                className="cursor-pointer text-slate-400 hover:text-accent-600 dark:hover:text-accent-500 transition"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/20" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>

              {/* Task Title & Notes */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block truncate font-medium',
                    isCompleted && 'line-through text-slate-400 dark:text-slate-500'
                  )}
                >
                  {task.title}
                </span>
                {task.note && (
                  <span className="block truncate text-xs text-slate-400 dark:text-slate-500">{task.note}</span>
                )}
              </div>

              {/* Task Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Add Subtask Button */}
                {!isCompleted && (
                  <button
                    type="button"
                    title={t('addSubtask')}
                    onClick={() => onAddSubtask(task)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                {/* Move to Today / Move to All */}
                {mode === 'all' && onMoveToToday && (
                  <button
                    type="button"
                    title={t('moveToToday')}
                    onClick={() => onMoveToToday(task)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-500 transition cursor-pointer"
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                )}
                {mode === 'today' && onMoveToAll && (
                  <button
                    type="button"
                    title={t('moveToAll')}
                    onClick={() => onMoveToAll(task)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition cursor-pointer"
                  >
                    <ListTodo className="w-4 h-4" />
                  </button>
                )}
                {mode === 'completed' && onRestore && (
                  <button
                    type="button"
                    title={t('restoreTask')}
                    onClick={() => onRestore(task)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}

                {/* Edit Button */}
                <button
                  type="button"
                  title={t('editTask')}
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  title={t('deleteTask')}
                  onClick={(e) => handleDeleteWithSwal(task, e)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Subtasks recursion */}
            {hasChildren && !isCollapsed && (
              <TaskTree
                tasks={task.subtasks!}
                mode={mode}
                busy={busy}
                onToggle={onToggle}
                onMoveToToday={onMoveToToday}
                onMoveToAll={onMoveToAll}
                onRestore={onRestore}
                onDelete={onDelete}
                onEdit={onEdit}
                onAddSubtask={onAddSubtask}
                level={level + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
