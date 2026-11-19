import React, { useState, useEffect } from 'react'
import type { TodoItem, TargetType } from '@shared/todo.type'
import { useI18n } from '@renderer/i18n/I18nContext'
import { Target, CheckSquare } from 'lucide-react'

interface EditTaskModalProps {
  task: TodoItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (
    id: string,
    data: {
      title: string
      note?: string
      targetType: TargetType
      currentValue?: number
      targetValue?: number
      unit?: string
    }
  ) => Promise<void>
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('simple')
  const [currentValue, setCurrentValue] = useState<string>('0')
  const [targetValue, setTargetValue] = useState<string>('')
  const [unit, setUnit] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setNote(task.note || '')
      setTargetType(task.targetType || 'simple')
      setCurrentValue(String(task.currentValue ?? 0))
      setTargetValue(task.targetValue !== undefined ? String(task.targetValue) : '')
      setUnit(task.unit || '')
    }
  }, [task])

  if (!isOpen || !task) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSaving(true)
    try {
      await onSave(task.id, {
        title: title.trim(),
        note: note.trim() || undefined,
        targetType,
        currentValue: targetType === 'numeric' ? Number(currentValue) || 0 : undefined,
        targetValue: targetType === 'numeric' && targetValue ? Number(targetValue) : undefined,
        unit: targetType === 'numeric' ? unit.trim() || undefined : undefined
      })
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

          {/* Type Toggle: Simple Checkbox vs Numeric Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">نوع کار یا هدف</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('simple')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  targetType === 'simple'
                    ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>کار عادی (تیک‌زدنی)</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('numeric')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  targetType === 'numeric'
                    ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>هدف عددی / رکوردی</span>
              </button>
            </div>
          </div>

          {/* Numeric Fields */}
          {targetType === 'numeric' && (
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">رکورد فعلی</label>
                <input
                  type="number"
                  min="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-accent-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">هدف نهایی *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="مثلاً 50"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-accent-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">واحد سنجش</label>
                <input
                  type="text"
                  placeholder="عدد شنا / صفحه"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-accent-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">توضیحات یا یادداشت</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
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
