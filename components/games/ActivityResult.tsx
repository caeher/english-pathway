'use client'

import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import ReactConfetti from 'react-confetti'
import { cn } from '@/lib/helpers'
import { useReducedMotion } from '@/lib/games/useReducedMotion'
import { starsFromPercent, passesThreshold } from '@/lib/games/scoring'

export interface ActivityResultProps {
  percent: number
  score?: number
  total?: number
  title?: string
  subtitle?: string
  explanations?: string[]
  showConfetti?: boolean
  onRetry?: () => void
  retryLabel?: string
  compact?: boolean
}

export default function ActivityResult({
  percent,
  score,
  total,
  title,
  subtitle,
  explanations = [],
  showConfetti = true,
  onRetry,
  retryLabel = 'Try again',
  compact = false,
}: ActivityResultProps) {
  const reducedMotion = useReducedMotion()
  const passed = passesThreshold(percent)
  const stars = starsFromPercent(percent)
  const shouldConfetti = showConfetti && passed && stars >= 2 && !reducedMotion

  const defaultTitle = passed
    ? percent >= 90
      ? 'Excellent!'
      : percent >= 70
        ? 'Good job!'
        : 'Keep practicing!'
    : 'Try again!'

  return (
    <div className={cn('relative', compact ? 'py-4' : 'py-8')}>
      {shouldConfetti && <ReactConfetti recycle={false} numberOfPieces={160} />}

      <motion.div
        initial={reducedMotion ? false : { scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'text-center max-w-md mx-auto p-6 rounded-2xl border-2',
          passed ? 'border-(--success)/40 bg-(--success-soft)' : 'border-red-300 bg-red-50 dark:bg-red-950/30'
        )}
        role="status"
        aria-live="polite"
      >
        <div className="text-4xl mb-3" aria-hidden>
          {'⭐'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </div>

        <h3
          className={cn(
            'font-display font-black mb-1',
            compact ? 'text-lg' : 'text-2xl',
            passed ? 'text-(--text-primary)' : 'text-red-600 dark:text-red-400'
          )}
        >
          {title ?? defaultTitle}
        </h3>

        {subtitle && <p className="text-sm text-(--text-secondary) mb-3">{subtitle}</p>}

        <p className="text-(--text-secondary) mb-2">
          {score !== undefined && total !== undefined ? (
            <>
              <span className="font-bold text-(--accent)">{score}</span> / {total} correct ({percent}%)
            </>
          ) : (
            <span className="font-bold text-(--accent)">{percent}%</span>
          )}
        </p>

        {!passed && (
          <p className="text-xs text-(--text-muted) mb-3">
            You need at least 70% to pass
          </p>
        )}

        {explanations.length > 0 && (
          <div className="mt-4 space-y-2 text-left">
            {explanations.map((exp) => (
              <p key={exp} className="text-xs text-(--text-secondary) bg-(--bg-card) p-3 rounded-xl border border-(--border-primary)">
                💡 {exp}
              </p>
            ))}
          </div>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-(--accent) text-white font-display font-bold text-sm hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          >
            <RotateCcw className="w-4 h-4" /> {retryLabel}
          </button>
        )}
      </motion.div>
    </div>
  )
}
