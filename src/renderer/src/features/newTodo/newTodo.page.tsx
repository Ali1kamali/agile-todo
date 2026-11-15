import React, { useState, useEffect } from 'react'
import { useI18n } from '@renderer/i18n/I18nContext'
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'
import Swal from 'sweetalert2'

interface TaskDraftItem {
  id: string
  title: string
  note?: string
  subtasks?: TaskDraftItem[]
}

interface NewCyclePageProps {
  onBack: () => void
  onSuccess: () => void
}

const DRAFT_STORAGE_KEY = 'new_cycle_form_draft'

export function NewCyclePage({ onBack, onSuccess }: NewCyclePageProps): React.JSX.Element {
  const { t, dir } = useI18n()

  const [title, setTitle] = useState('')
  const [durationType, setDurationType] = useState<'months' | 'days' | 'dates'>('months')
  const [monthsCount, setMonthsCount] = useState<number>(3)
  const [daysCount, setDaysCount] = useState<number>(90)
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>('')
  const [tasks, setTasks] = useState<TaskDraftItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate End Date whenever duration changes
  useEffect(() => {
    const start = new Date(startDate)
    if (isNaN(start.getTime())) return

    if (durationType === 'months') {
      const target = new Date(start)
      target.setMonth(target.getMonth() + monthsCount)
      setEndDate(target.toISOString().slice(0, 10))
    } else if (durationType === 'days') {
      const target = new Date(start)
      target.setDate(target.getDate() + daysCount)
      setEndDate(target.toISOString().slice(0, 10))
    }
  }, [startDate, durationType, monthsCount, daysCount])

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed.title) setTitle(parsed.title)
        if (parsed.durationType) setDurationType(parsed.durationType)
        if (parsed.monthsCount) setMonthsCount(parsed.monthsCount)
        if (parsed.daysCount) setDaysCount(parsed.daysCount)
        if (parsed.startDate) setStartDate(parsed.startDate)
        if (parsed.endDate) setEndDate(parsed.endDate)
        if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks)
      }
    } catch {
      // Ignore draft read errors
    }
  }, [])

  // Auto-save draft on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          title,
          durationType,
          monthsCount,
          daysCount,
          startDate,
          endDate,
          tasks
        })
      )
    } catch {
      // Ignore storage write issues
    }
  }, [title, durationType, monthsCount, daysCount, startDate, endDate, tasks])

  // Hierarchy Task manipulation helpers
  const handleAddRootTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        note: '',
        subtasks: []
      }
    ])
  }

  const handleAddSubtask = (parentId: string) => {
    function addRecursively(items: TaskDraftItem[]): TaskDraftItem[] {
      return items.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            subtasks: [
              ...(item.subtasks || []),
              { id: crypto.randomUUID(), title: '', note: '', subtasks: [] }
            ]
          }
        }
        if (item.subtasks && item.subtasks.length > 0) {
          return { ...item, subtasks: addRecursively(item.subtasks) }
        }
        return item
      })
    }
    setTasks(addRecursively(tasks))
  }

  const handleUpdateTask = (id: string, newTitle: string, newNote?: string) => {
    function updateRecursively(items: TaskDraftItem[]): TaskDraftItem[] {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, title: newTitle, note: newNote ?? item.note }
        }
        if (item.subtasks && item.subtasks.length > 0) {
          return { ...item, subtasks: updateRecursively(item.subtasks) }
        }
        return item
      })
    }
    setTasks(updateRecursively(tasks))
  }

  const handleDeleteTask = (id: string) => {
    function deleteRecursively(items: TaskDraftItem[]): TaskDraftItem[] {
      return items
        .filter((item) => item.id !== id)
        .map((item) => {
          if (item.subtasks && item.subtasks.length > 0) {
            return { ...item, subtasks: deleteRecursively(item.subtasks) }
          }
          return item
        })
    }
    setTasks(deleteRecursively(tasks))
  }

  // Clear Form All
  const handleClearAll = async () => {
    const isDarkMode = document.documentElement.classList.contains('dark')

    const res = await Swal.fire({
      title: t('clearAllConfirmTitle'),
      text: t('clearAllConfirmText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      background: isDarkMode ? '#0f172a' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#0f172a'
    })

    if (res.isConfirmed) {
      setTitle('')
      setTasks([])
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError(t('cycleNameLabel'))
      return
    }

    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    if (isNaN(start) || isNaN(end) || end <= start) {
      setError('تاریخ پایان باید بعد از تاریخ شروع باشد.')
      return
    }

    const durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
    if (durationDays > 186) {
      setError(t('cycleExceedError'))
      return
    }

    const isDarkMode = document.documentElement.classList.contains('dark')

    // Check if active cycle exists and ask for confirmation
    const activeCycle = await window.api.getActiveCycle()
    let transferUnfinished = false

    if (activeCycle) {
      const result = await Swal.fire({
        title: t('cycleConfirmTitle'),
        text: t('cycleConfirmText'),
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: '#0284c7',
        denyButtonColor: '#64748b',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: t('transferYes'),
        denyButtonText: t('transferNo'),
        cancelButtonText: t('cancel'),
        background: isDarkMode ? '#0f172a' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a'
      })

      if (result.isDismissed) {
        return
      }
      transferUnfinished = result.isConfirmed
    }

    setIsSubmitting(true)
    try {
      await window.api.createCycle({
        title: title.trim(),
        startDate,
        endDate,
        tasks,
        transferUnfinishedTasks: transferUnfinished
      })

      localStorage.removeItem(DRAFT_STORAGE_KEY)
      await Swal.fire({
        title: t('cycleCreatedSuccess'),
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: isDarkMode ? '#0f172a' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a'
      })
      onSuccess()
    } catch (err: any) {
      setError(err?.message || 'خطا در ایجاد دوره.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Recursive Draft Item Inputs
  const renderDraftTasks = (items: TaskDraftItem[], level = 0) => {
    return (
      <div className={level > 0 ? (dir === 'rtl' ? 'mr-6 pr-3 border-r-2 border-accent-500/30 dark:border-accent-500/20 mt-2 space-y-2' : 'ml-6 pl-3 border-l-2 border-accent-500/30 dark:border-accent-500/20 mt-2 space-y-2') : 'space-y-3'}>
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleUpdateTask(item.id, e.target.value)}
                placeholder={level === 0 ? 'هدف اصلی یا کار کلیدی...' : 'زیرکار یا مرحله اجرایی...'}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-accent-500"
              />
              <button
                type="button"
                onClick={() => handleAddSubtask(item.id)}
                title={t('addSubtask')}
                className="flex items-center gap-1 rounded-lg bg-accent-50 dark:bg-accent-500/10 px-2.5 py-1.5 text-xs font-semibold text-accent-700 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('addSubtask')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(item.id)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {item.subtasks && item.subtasks.length > 0 && renderDraftTasks(item.subtasks, level + 1)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-slate-100 dark:bg-slate-950 overflow-y-auto p-4 md:p-8 flex justify-center items-start transition-colors">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 p-6 md:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 my-auto sm:my-0">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-md shadow-accent-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">{t('newCycleTitle')}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('newCycleSubtitle')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowRight className={dir === 'rtl' ? '' : 'rotate-180'} size={15} />
            <span>{t('backToHome')}</span>
          </button>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 p-4 border border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs mb-6">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p>{t('recommendedNotice')}</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 p-4 text-xs font-semibold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t('cycleNameLabel')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: دوره جامع تسلط بر جاوااسکریپت و سبک زندگی سالم"
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition"
            />
          </div>

          {/* Duration Mode Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{t('cycleDurationType')}</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDurationType('months')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  durationType === 'months'
                    ? 'border-accent-600 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {t('durationMonths')}
              </button>
              <button
                type="button"
                onClick={() => setDurationType('days')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  durationType === 'days'
                    ? 'border-accent-600 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {t('durationDays')}
              </button>
              <button
                type="button"
                onClick={() => setDurationType('dates')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  durationType === 'dates'
                    ? 'border-accent-600 bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {t('customDates')}
              </button>
            </div>

            {/* Quick Pickers based on mode */}
            {durationType === 'months' && (
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 6].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonthsCount(m)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition cursor-pointer ${
                      monthsCount === m
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m} {m === 3 ? '(پیشنهادی)' : 'ماهه'}
                  </button>
                ))}
              </div>
            )}

            {durationType === 'days' && (
              <div className="flex items-center gap-2 pt-1">
                {[30, 60, 90, 180].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysCount(d)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition cursor-pointer ${
                      daysCount === d
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d} روزه
                  </button>
                ))}
              </div>
            )}

            {/* Dates Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('startDate')}</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs text-slate-800 dark:text-slate-100 outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('endDate')}</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={durationType !== 'dates'}
                    required
                    className="w-full text-xs text-slate-800 dark:text-slate-100 outline-none bg-transparent disabled:text-slate-400 dark:disabled:text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Structured Tasks and Nested Subtasks */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('taskHierarchySection')}</h3>
              <button
                type="button"
                onClick={handleAddRootTask}
                className="flex items-center gap-1.5 rounded-xl bg-accent-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-700 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('addTask')}</span>
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                هنوز کاری اضافه نشده است. می‌توانید اهداف و کارهای اولیه دوره را همراه با زیرکارها در اینجا تعریف کنید.
              </div>
            ) : (
              renderDraftTasks(tasks)
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer"
            >
              {t('clearAll')}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-accent-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-accent-600/20 hover:bg-accent-700 disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting ? t('submitting') : t('submitCycle')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
