import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { TodoItem } from '../../../../shared/todo.type'

export type TodoListProps = {
  todos: readonly TodoItem[]
  showCheckbox?: boolean
  showExpandArrow?: boolean
  busy?: boolean
  onToggle?: (todo: TodoItem, completed: boolean) => void | Promise<void>
  renderAction?: (todo: TodoItem) => ReactNode
}

type TodoRowProps = Omit<TodoListProps, 'todos'> & {
  todo: TodoItem
}

function TodoRow({
  todo,
  showCheckbox = false,
  showExpandArrow = true,
  busy = false,
  onToggle,
  renderAction
}: TodoRowProps) {
  const [expanded, setExpanded] = useState(false)
  const children = todo.subtasks ?? []
  const hasChildren = children.length > 0
  const canCollapse = showExpandArrow && hasChildren
  const childrenVisible = hasChildren && (!canCollapse || expanded)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="list-none"
    >
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        {canCollapse && (
          <button
            type="button"
            aria-label={expanded ? `بستن زیرکارهای ${todo.title}` : `نمایش زیرکارهای ${todo.title}`}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <motion.svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="size-4"
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </button>
        )}

        {showCheckbox && (
          <input
            type="checkbox"
            checked={todo.isCompleted}
            disabled={busy || !onToggle}
            aria-label={`وضعیت انجام ${todo.title}`}
            onChange={(event) => {
              void onToggle?.(todo, event.target.checked)
            }}
            className="size-4 shrink-0 cursor-pointer accent-indigo-600 disabled:cursor-not-allowed"
          />
        )}

        <span
          className={`min-w-0 flex-1 break-words text-sm ${
            todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
          }`}
        >
          {todo.title}
        </span>

        {hasChildren && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {children.length}
          </span>
        )}

        {renderAction?.(todo)}
      </div>

      <AnimatePresence initial={false}>
        {childrenVisible && (
          <motion.ul
            key="subtasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="me-4 mt-2 flex list-none flex-col gap-2 overflow-hidden border-e border-slate-200 pe-3"
          >
            {children.map((child) => (
              <TodoRow
                key={child.id}
                todo={child}
                showCheckbox={showCheckbox}
                showExpandArrow={showExpandArrow}
                busy={busy}
                onToggle={onToggle}
                renderAction={renderAction}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

export function TodoList({ todos, ...props }: TodoListProps) {
  return (
    <ul className="flex list-none flex-col gap-2 p-0">
      <AnimatePresence initial={false}>
        {todos.map((todo) => (
          <TodoRow key={todo.id} todo={todo} {...props} />
        ))}
      </AnimatePresence>
    </ul>
  )
}
