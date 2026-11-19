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
  Plus,
  Minus,
  CornerDownLeft,
  CornerDownRight
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
  onUpdateValue?: (todo: TodoItem, delta: number) => Promise<void>
  level?: number
  isReadOnlyParent?: boolean
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
  onUpdateValue,
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
        'space-y-2',
        level > 0 &&
          (dir === 'rtl'
            ? 'mr-6 border-r-2 border-accent-500/30 dark:border-accent-500/20 pr-3 mt-1.5'
            : 'ml-6 border-l-2 border-accent-500/30 dark:border-accent-500/20 pl-3 mt-1.5')
      )}
    >
      {tasks.map((task) => {
        const hasChildren = task.subtasks && task.subtasks.length > 0
        const isCollapsed = !!collapsedMap[task.id]
        const isCompleted = task.isCompleted || task.status === 'completed'

        // Check if this task is a read-only context parent in Today's section
        // In Today section, if a parent itself is NOT active (status !== 'active') but displayed as context header:
        const isContextParentInToday = mode === 'today' && task.status !== 'active'
        const isNumeric = task.targetType === 'numeric' && task.targetValue && task.targetValue > 0
        const currentVal = task.currentValue ?? 0
        const targetVal = task.targetValue ?? 0
        const progressPct = isNumeric ? Math.min(100, Math.round((currentVal / targetVal) * 100)) : 0

        return (
          <li key={task.id} className="group relative">
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl p-2.5 transition-all text-sm select-none border relative',
                isContextParentInToday
                  ? 'bg-slate-100/80 dark:bg-slate-800/60 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  : isCompleted
                  ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/80 text-slate-400 dark:text-slate-500'
                  : level > 0
                  ? 'bg-slate-100/90 dark:bg-slate-800 border-slate-300/80 dark:border-slate-700 hover:border-accent-500 dark:hover:border-accent-400 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-accent-500 dark:hover:border-accent-400 hover:shadow-xs text-slate-900 dark:text-slate-100'
              )}
            >
              {/* Visual Branch Indicator for Subtasks */}
              {level > 0 && (
                <div
                  className={cn(
                    'text-accent-500/60 dark:text-accent-400/50 shrink-0 select-none'
                  )}
                  title="زیرکار"
                >
                  {dir === 'rtl' ? (
                    <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <CornerDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </div>
              )}

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
              {isContextParentInToday ? (
                // In Today section, root parents that are only headers are disabled
                <span
                  title="تکمیل کار اصلی فقط در بخش «همه کارها» امکان‌پذیر است"
                  className="text-slate-300 dark:text-slate-600 cursor-not-allowed"
                >
                  <Circle className="w-5 h-5 opacity-40" />
                </span>
              ) : (
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
              )}

              {/* Task Title & Notes */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'block truncate font-medium',
                      level > 0 ? 'text-[13px] text-slate-800 dark:text-slate-100 font-semibold' : 'text-slate-900 dark:text-slate-100',
                      isCompleted && 'line-through text-slate-400 dark:text-slate-500 font-normal',
                      isContextParentInToday && 'text-xs text-slate-600 dark:text-slate-300 font-semibold'
                    )}
                  >
                    {task.title}
                  </span>

                  {isContextParentInToday && (
                    <span className="text-[10px] rounded-md bg-slate-200/70 dark:bg-slate-700/60 px-1.5 py-0.5 text-slate-500 dark:text-slate-400">
                      کار والد
                    </span>
                  )}
                </div>

                {task.note && (
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400 font-normal">{task.note}</span>
                )}

                {/* Numeric Target Progress Indicator */}
                {isNumeric && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-accent-600 dark:bg-accent-500 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-accent-700 dark:text-accent-300">
                      {currentVal} / {targetVal} {task.unit || ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Numeric Target Increment/Decrement Quick Buttons */}
              {isNumeric && !isCompleted && !isContextParentInToday && onUpdateValue && (
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700 shadow-2xs">
                  <button
                    type="button"
                    title="کاهش رکورد"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateValue(task, -1)
                    }}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 text-xs font-bold text-slate-800 dark:text-slate-100 min-w-4 text-center">
                    {currentVal}
                  </span>
                  <button
                    type="button"
                    title="افزایش رکورد"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateValue(task, 1)
                    }}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Task Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isContextParentInToday && !isCompleted && (
                  <button
                    type="button"
                    title={t('addSubtask')}
                    onClick={() => onAddSubtask(task)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                {/* Move to Today (single task or subtask) */}
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

                {/* Move from Today back to All */}
                {mode === 'today' && !isContextParentInToday && onMoveToAll && (
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

                {!isContextParentInToday && (
                  <>
                    <button
                      type="button"
                      title={t('editTask')}
                      onClick={() => onEdit(task)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title={t('deleteTask')}
                      onClick={(e) => handleDeleteWithSwal(task, e)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
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
                onUpdateValue={onUpdateValue}
                level={level + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
