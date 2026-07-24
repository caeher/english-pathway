'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, HelpCircle, RotateCcw, Sparkles } from 'lucide-react'
import ReactConfetti from 'react-confetti'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import { buildCompletionSummary } from '@/lib/learn/activity-completion'
import type { FollowUpDecision } from '@/lib/learn/follow-up-planner'
import { cn } from '@/lib/helpers'
import { useReducedMotion } from '@/lib/games/useReducedMotion'
import { resultTransition } from '@/lib/motion/system'
import { passesThreshold, starsFromPercent } from '@/lib/games/scoring'

export interface ActivityCompletionCardProps {
  result: ActivityCompleteResult
  followUp?: FollowUpDecision | null
  explanations?: string[]
  onAcceptFollowUp?: () => void
  onDeclineFollowUp?: () => void
  onRetry?: () => void
  onRequestHelp?: () => void
  continueLoading?: boolean
}

export default function ActivityCompletionCard({
  result,
  followUp = null,
  explanations = [],
  onAcceptFollowUp,
  onDeclineFollowUp,
  onRetry,
  onRequestHelp,
  continueLoading = false,
}: ActivityCompletionCardProps) {
  const reducedMotion = useReducedMotion()
  const primaryRef = useRef<HTMLButtonElement>(null)
  const scorePercent = result.scorePercent ?? Math.round((result.score / result.total) * 100)
  const passed = passesThreshold(scorePercent)
  const stars = starsFromPercent(scorePercent)
  const hasReviewRefs = (result.reviewContentRefs?.length ?? 0) > 0

  const summary = buildCompletionSummary({
    score: result.score,
    total: result.total,
    scorePercent,
    correctness: result.correctness ?? 'needs-practice',
    explanations,
    nextAction: result.nextAction ?? 'retry',
    metrics: result.metrics ?? {},
    weakItemIndexes: result.weakItemIndexes ?? [],
    hasReviewRefs,
    followUp,
  })

  const shouldConfetti = summary.variant === 'complete' && stars >= 2 && !reducedMotion

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true })
  }, [])

  const handlePrimary = () => {
    if (summary.primaryAction === 'retry') {
      onRetry?.()
      return
    }
    if (summary.primaryAction === 'review' && hasReviewRefs) {
      window.location.assign('/review')
      return
    }
    onAcceptFollowUp?.()
  }

  return (
    <div className="relative py-4">
      {shouldConfetti && <ReactConfetti recycle={false} numberOfPieces={160} />}

      <motion.div
        {...(reducedMotion ? { initial: false } : resultTransition)}
        className={cn(
          'mx-auto max-w-md rounded-2xl border-2 p-6 text-center',
          passed ? 'border-(--success)/40 bg-(--success-soft)' : 'border-red-300 bg-red-50 dark:bg-red-950/30',
        )}
        role="status"
        aria-live="polite"
        aria-label="Activity result"
      >
        <div className="mb-3 text-4xl" aria-hidden>
          {'⭐'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </div>

        <h3 className="mb-1 font-display text-2xl font-black text-(--text-primary)">
          {summary.title}
        </h3>

        <p className="mb-2 text-sm text-(--text-secondary)">{summary.subtitle}</p>

        <p className="mb-2 text-(--text-secondary)">
          <span className="font-bold text-(--accent)">{result.score}</span>
          {' / '}
          {result.total}
          {' correct ('}
          {scorePercent}
          %)
        </p>

        <p className="mb-4 text-sm font-medium text-(--text-primary)">{summary.recommendation}</p>

        {explanations.length > 0 && (
          <div className="mt-4 space-y-2 text-left">
            {explanations.map((exp) => (
              <p
                key={exp}
                className="rounded-xl border border-(--border-primary) bg-(--bg-card) p-3 text-xs text-(--text-secondary)"
              >
                {exp}
              </p>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            ref={primaryRef}
            type="button"
            onClick={handlePrimary}
            disabled={continueLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-display font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:opacity-60"
          >
            {summary.primaryAction === 'follow-up' && <Sparkles className="h-4 w-4" />}
            {summary.primaryAction === 'continue' && <ArrowRight className="h-4 w-4" />}
            {summary.primaryAction === 'retry' && <RotateCcw className="h-4 w-4" />}
            {summary.primaryLabel}
          </button>

          {summary.showRetry && summary.primaryAction !== 'retry' && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-(--border-primary) bg-(--bg-card) px-5 py-2.5 text-sm font-display font-bold text-(--text-primary) transition-colors hover:bg-(--bg-tertiary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
          )}

          {summary.showReview && hasReviewRefs && summary.primaryAction !== 'review' && (
            <Link
              href="/review"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-(--accent)/40 bg-(--accent-soft) px-5 py-2.5 text-sm font-display font-bold text-(--accent) no-underline transition-colors hover:bg-(--accent)/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
            >
              Open review
            </Link>
          )}

          {summary.showTryAlternative && onDeclineFollowUp && (
            <button
              type="button"
              onClick={onDeclineFollowUp}
              disabled={continueLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-(--border-primary) bg-(--bg-card) px-5 py-2.5 text-sm font-display font-bold text-(--text-primary) transition-colors hover:bg-(--bg-tertiary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:opacity-60"
            >
              <ArrowRight className="h-4 w-4" />
              Try something else
            </button>
          )}

          {summary.showContinueAnyway && onDeclineFollowUp && (
            <button
              type="button"
              onClick={onDeclineFollowUp}
              disabled={continueLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-(--border-primary) bg-(--bg-card) px-5 py-2.5 text-sm font-display font-bold text-(--text-secondary) transition-colors hover:bg-(--bg-tertiary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:opacity-60"
            >
              Continue anyway
            </button>
          )}

          {onRequestHelp && (
            <button
              type="button"
              onClick={onRequestHelp}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-(--border-primary) bg-(--bg-card) px-5 py-2.5 text-sm font-display font-bold text-(--text-secondary) transition-colors hover:bg-(--bg-tertiary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
            >
              <HelpCircle className="h-4 w-4" />
              Ask for explanation
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-(--text-muted)">
          Your progress is saved. Due reviews are scheduled separately to help you remember what needs more work.
        </p>
      </motion.div>
    </div>
  )
}
