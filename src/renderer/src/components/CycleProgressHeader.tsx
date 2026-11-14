import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Calendar, Sparkles } from 'lucide-react'
import type { Cycle } from '@shared/todo.type'
import { useI18n } from '@renderer/i18n/I18nContext'

interface CycleProgressHeaderProps {
  cycle: Cycle | null
  progress: number
  onNewCycleClick: () => void
}

export const CycleProgressHeader: React.FC<CycleProgressHeaderProps> = ({
  cycle,
  progress,
  onNewCycleClick
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
    <header className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/80 mb-5 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              {cycle ? cycle.title : t('noActiveCycle')}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{cycle ? t('cycleRemainingDays', { days: remainingDays }) : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-black text-sky-600 tracking-tight">
              {animatedProgress}%
            </span>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('cycleProgress')}
            </span>
          </div>

          <button
            type="button"
            onClick={onNewCycleClick}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('createNewCycle')}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/60">
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
