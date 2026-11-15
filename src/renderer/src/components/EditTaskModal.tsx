import React, { useState, useEffect } from 'react'
import type { TodoItem } from '@shared/todo.type'
import { useI18n } from '@renderer/i18n/I18nContext'

interface EditTaskModalProps {
  task: TodoItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, title: string, note?: string) => Promise<void>
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setNote(task.note || '')
    }
  }, [task])

  if (!isOpen || !task) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSaving(true)
    try {
      await onSave(task.id, title.trim(), note.trim() || undefined)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all border border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">{t('editTask')}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('cycleNameLabel')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">توضیحات یا یادداشت</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              {isSaving ? t('submitting') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
