import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Calendar, Sparkles, Settings } from 'lucide-react'
import type { Cycle } from '@shared/todo.type'
import { useI18n } from '@renderer/i18n/I18nContext'

interface CycleProgressHeaderProps {
  cycle: Cycle | null
  progress: number
  onNewCycleClick: () => void
  onOpenSettings: () => void
}

export const CycleProgressHeader: React.FC<CycleProgressHeaderProps> = ({
  cycle,
  progress,
  onNewCycleClick,
  onOpenSettings
}) => {
  const { t } = useI18n()
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Initial startup animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
    }, 150)
    return () => clearTimeout(timer)
  }, [progress])

  // Calculate remaining days
  let remainingDays = 0
  if (cycle) {
    const today = new Date().setHours(0, 0, 0, 0)
    const end = new Date(cycle.endDate).setHours(0, 0, 0, 0)
    remainingDays = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)))
  }

  return (
    <header className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 mb-5 relative overflow-hidden transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {cycle ? cycle.title : t('noActiveCycle')}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{cycle ? t('cycleRemainingDays', { days: remainingDays }) : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
              {animatedProgress}%
            </span>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('cycleProgress')}
            </span>
          </div>

          <button
            type="button"
            onClick={onNewCycleClick}
            className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-white transition active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('createNewCycle')}</span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title={t('settings')}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs active:scale-95"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700/60">
        <motion.div
          className="relative h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${animatedProgress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Subtle Shimmer Animation */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite_ease-in-out] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </motion.div>
      </div>
    </header>
  )
}
