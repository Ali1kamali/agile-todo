import React, { useEffect, useRef } from 'react'
import { X, Moon, Sun, Monitor, Check, Palette, Languages } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useTheme, type AccentColor, type ThemeMode } from '../theme/ThemeContext'
import { cn } from '../utils/cn'

interface SettingsSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const ACCENT_COLORS: { id: AccentColor; labelFa: string; labelEn: string; bgClass: string }[] = [
  { id: 'sky', labelFa: 'آبی آسمانی', labelEn: 'Sky Blue', bgClass: 'bg-sky-500' },
  { id: 'emerald', labelFa: 'زمردی', labelEn: 'Emerald Green', bgClass: 'bg-emerald-500' },
  { id: 'violet', labelFa: 'بنفش', labelEn: 'Violet', bgClass: 'bg-violet-500' },
  { id: 'amber', labelFa: 'کهربایی', labelEn: 'Amber', bgClass: 'bg-amber-500' },
  { id: 'rose', labelFa: 'رز', labelEn: 'Rose', bgClass: 'bg-rose-500' }
]

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ isOpen, onClose }) => {
  const { t, locale, setLocale, dir } = useI18n()
  const { theme, setTheme, accent, setAccent } = useTheme()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity duration-300">
      <div
        ref={sidebarRef}
        className={cn(
          'fixed inset-y-0 w-80 max-w-full bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800',
          dir === 'rtl' ? 'left-0 border-r' : 'right-0 border-l'
        )}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('settings')}</h2>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section: Language */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Languages className="w-4 h-4 text-sky-500" />
              <span>{t('language')}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocale('fa')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold border transition',
                  locale === 'fa'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <span>فارسی</span>
                {locale === 'fa' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setLocale('en')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold border transition',
                  locale === 'en'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <span>English</span>
                {locale === 'en' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Section: Appearance / Theme Mode */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Palette className="w-4 h-4 text-sky-500" />
              <span>{t('themeMode')}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light' as ThemeMode, icon: Sun, label: t('themeLight') },
                { id: 'dark' as ThemeMode, icon: Moon, label: t('themeDark') },
                { id: 'system' as ThemeMode, icon: Monitor, label: t('themeSystem') }
              ].map((item) => {
                const Icon = item.icon
                const isSelected = theme === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-medium border transition',
                      isSelected
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section: Accent Color */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>{t('accentColor')}</span>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAccent(c.id)}
                  title={locale === 'fa' ? c.labelFa : c.labelEn}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs',
                    c.bgClass,
                    accent === c.id ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : 'opacity-80'
                  )}
                >
                  {accent === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          <span>Personal Growth Todo v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
