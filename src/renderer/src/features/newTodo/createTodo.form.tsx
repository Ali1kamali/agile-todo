import { useState } from 'react'
import type { TodoItem, TodoStatus } from 'src/shared/'

interface TodoCreatorProps {
  onAdd: (todo: TodoItem) => void
}

interface TodoDraft {
  title: string
  note: string
  subtasks: TodoDraft[]
}

const createEmptyDraft = (): TodoDraft => ({
  title: '',
  note: '',
  subtasks: []
})

const createTodo = (draft: TodoDraft): TodoItem => ({
  id: crypto.randomUUID(),
  title: draft.title.trim(),
  note: draft.note.trim(),
  isCompleted: false,
  status: 'active' satisfies TodoStatus,
  createdAt: new Date().toISOString(),
  subtasks: draft.subtasks.filter((subtask) => subtask.title.trim()).map(createTodo)
})

interface TodoDraftEditorProps {
  draft: TodoDraft
  onChange: (draft: TodoDraft) => void
  onRemove?: () => void
}

function TodoDraftEditor({ draft, onChange, onRemove }: TodoDraftEditorProps) {
  const [showSubtasks, setShowSubtasks] = useState(true)

  const updateTitle = (title: string) => {
    onChange({ ...draft, title })
  }

  const updateNote = (note: string) => {
    onChange({ ...draft, note })
  }

  const addSubtask = () => {
    onChange({
      ...draft,
      subtasks: [...draft.subtasks, createEmptyDraft()]
    })
  }

  const updateSubtask = (index: number, updated: TodoDraft) => {
    onChange({
      ...draft,
      subtasks: draft.subtasks.map((item, i) => (i === index ? updated : item))
    })
  }

  const removeSubtask = (index: number) => {
    onChange({
      ...draft,
      subtasks: draft.subtasks.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-300 p-3">
      <div className="flex gap-2">
        <input
          value={draft.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="عنوان Todo"
          className="min-w-0 flex-1 rounded border p-2"
        />

        {onRemove && (
          <button type="button" onClick={onRemove} className="text-red-500">
            حذف
          </button>
        )}
      </div>

      <textarea
        value={draft.note}
        onChange={(e) => updateNote(e.target.value)}
        placeholder="توضیحات (اختیاری)"
        className="w-full rounded border p-2"
        rows={2}
      />

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowSubtasks((prev) => !prev)}
          className="text-sm text-blue-600"
        >
          {showSubtasks ? 'مخفی کردن زیرمجموعه‌ها' : 'نمایش زیرمجموعه‌ها'}
        </button>

        {showSubtasks && (
          <div className="space-y-3 border-r-2 border-gray-200 pr-3">
            {draft.subtasks.map((subtask, index) => (
              <TodoDraftEditor
                key={index}
                draft={subtask}
                onChange={(updated) => updateSubtask(index, updated)}
                onRemove={() => removeSubtask(index)}
              />
            ))}

            <button
              type="button"
              onClick={addSubtask}
              className="rounded bg-gray-100 px-3 py-2 text-sm"
            >
              + افزودن زیرمجموعه
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TodoCreator({ onAdd }: TodoCreatorProps) {
  const [draft, setDraft] = useState<TodoDraft>(createEmptyDraft)

  const handleAdd = () => {
    if (!draft.title.trim()) return

    onAdd(createTodo(draft))
    setDraft(createEmptyDraft())
  }

  const clear = () => {}

  return (
    <div className="space-y-4">
      <TodoDraftEditor draft={draft} onChange={setDraft} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.title.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          افزودن Todo
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!draft.title.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          پاک کردن همه
        </button>
      </div>
    </div>
  )
}
