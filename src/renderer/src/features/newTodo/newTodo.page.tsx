import { PageName } from '@renderer/types/pageName.type'
import { LocalStorageManager } from '@renderer/utils/localStorage'
import { useEffect, useRef, useState } from 'react'
import TodoCreator from './createTodo.form';

type NewTodo = {
  title: string
  description: string
  dueDate: string
}

type CreateTodoProps = {
  setPage: (page: PageName) => void
  listPage: PageName
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function dateAfterMonths(months: number): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + months
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const day = Math.min(today.getDate(), lastDayOfMonth)

  return toLocalDateString(new Date(year, month, day))
}

export function NewTodo({ setPage, listPage }: CreateTodoProps): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const storage = useRef<LocalStorageManager | null>(null)

  useEffect(() => {
    storage.current = new LocalStorageManager()
  }, [])

  const onCreate = (todo: NewTodo): void => {}

  async function handleSubmit() {
    const trimmedTitle = title.trim()

    if (!trimmedTitle || !dueDate) {
      setError('عنوان و تاریخ انجام را وارد کن.')
      return
    }

    if (dueDate < toLocalDateString(new Date())) {
      setError('تاریخ انجام نمی‌تواند در گذشته باشد.')
      return
    }

    setError('')
    setIsSaving(true)

    try {
      await onCreate({
        title: trimmedTitle,
        description: description.trim(),
        dueDate
      })
      setPage(listPage)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ثبت کار انجام نشد.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-xl space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div>
          <TodoCreator onAdd={() => {}}></TodoCreator>
        </div>
        <div>
          <h1 className="text-xl font-bold">کار جدید</h1>
          <p className="mt-1 text-sm text-slate-500">اطلاعات کار و زمان انجام آن را مشخص کن.</p>
        </div>
        <div>
          <p>از کار های قبل 10 % باقیمانده</p>
          <p>از تسک های قبل 10 روز باقی مونده</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="todo-title" className="block text-sm font-medium">
            عنوان
          </label>
          <input
            id="todo-title"
            name="title"
            type="text"
            required
            maxLength={150}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً تکمیل گزارش"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="todo-description" className="block text-sm font-medium">
            توضیحات <span className="font-normal text-slate-500">(اختیاری)</span>
          </label>
          <textarea
            id="todo-description"
            name="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="جزئیات کار را بنویس..."
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div className="space-y-3">
          <label htmlFor="todo-date" className="block text-sm font-medium">
            تاریخ انجام
          </label>
          <input
            id="todo-date"
            name="dueDate"
            type="date"
            required
            min={toLocalDateString(new Date())}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />

          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setDueDate(dateAfterMonths(months))}
                className="cursor-pointer rounded-lg border border-sky-200 px-3 py-2 text-sm text-sky-700 hover:bg-sky-50"
              >
                {months} ماه بعد
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => setPage(listPage)}
            disabled={isSaving}
            className="cursor-pointer rounded-lg border border-slate-300 px-5 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={isSaving}
            className="cursor-pointer rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'در حال ثبت...' : 'تأیید و ثبت'}
          </button>
        </div>
      </div>
    </main>
  )
}
