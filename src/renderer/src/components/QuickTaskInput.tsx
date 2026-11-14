import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useI18n } from '@renderer/i18n/I18nContext'

interface QuickTaskInputProps {
  onAdd: (title: string, parentId?: string) => Promise<void>
  parentId?: string
  placeholder?: string
}

export const QuickTaskInput: React.FC<QuickTaskInputProps> = ({
  onAdd,
  parentId,
  placeholder
}) => {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isAdding) return

    setIsAdding(true)
    try {
      await onAdd(title.trim(), parentId)
      setTitle('')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-2">
      <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-3 py-2 border border-slate-200 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition">
        <Plus className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder || (parentId ? t('addSubtaskPlaceholder') : t('addTaskPlaceholder'))}
          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim() || isAdding}
          className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-0 transition"
        >
          {t('save')}
        </button>
      </div>
    </form>
  )
}
