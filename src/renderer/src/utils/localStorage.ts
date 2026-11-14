import { TodoItem } from 'src/shared'

export type LocalStorageKey = 'newTodo' | 'app_data'

export interface NewTodo {
  todolist: TodoItem[]
  interval: number
  intervalType: 'month' | 'day'
  'move-last-todos-to-here': boolean
}
export interface AppData {
  them: 'dark'
}
export class LocalStorageManager<T = NewTodo | AppData> {
  private timeoutId: NodeJS.Timeout | number | null
  public key: LocalStorageKey
  public delay: number

  /**
   * @param {LocalStorageKey} key - کلید ذخیره‌سازی در localStorage
   * @param {number} delay - میزان تأخیر برای Debounce (به میلی‌ثانیه، پیش‌فرض ۵۰۰)
   */
  constructor(key: LocalStorageKey = 'app_data', delay: number = 500) {
    this.key = key
    this.delay = delay
    this.timeoutId = null
  }

  /**
   * ذخیره مستقیم داده در لوکال استوریج
   * @param {T | string} value
   */
  save(value: T | string): void {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(this.key, serializedValue)
    } catch (error) {
      console.error('خطا در ذخیره‌سازی:', error)
    }
  }

  /**
   * خواندن داده از لوکال استوریج
   * @returns {T | string | null}
   */
  load(): T | string | null {
    try {
      const data = localStorage.getItem(this.key)
      if (data === null) return null

      try {
        return JSON.parse(data) as T
      } catch {
        return data
      }
    } catch (error) {
      console.error('خطا در خواندن داده:', error)
      return null
    }
  }

  /**
   * پاک کردن کلید از لوکال استوریج
   */
  clear(): void {
    try {
      localStorage.removeItem(this.key)
    } catch (error) {
      console.error('خطا در پاک کردن داده:', error)
    }
  }

  /**
   * تنظیم مقدار پیش‌فرض (اگر داده‌ای از قبل وجود نداشته باشد)
   * @param {T | string} defaultValue
   */
  setDefault(defaultValue: T | string): void {
    if (this.load() === null) {
      this.save(defaultValue)
    }
  }

  /**
   * مدیریت تایپ کاربر همراه با Debounce
   * @param {Event} event - رویداد input از المان متنی
   * @param {(value: string) => void} [onSaveCallback] - تابع اختیاری برای زمانی که ذخیره انجام شد
   */
  handleTyping(event: Event, onSaveCallback?: (value: string) => void): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement
    if (!target) return

    const value = target.value

    // پاک کردن تایمر قبلی
    if (this.timeoutId) {
      clearTimeout(this.timeoutId as NodeJS.Timeout)
    }

    // تنظیم تایمر جدید
    this.timeoutId = setTimeout(() => {
      this.save(value)
      if (typeof onSaveCallback === 'function') {
        onSaveCallback(value)
      }
    }, this.delay)
  }
}
