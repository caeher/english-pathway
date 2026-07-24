'use client'

import Link from 'next/link'
import { CheckCircle2, Loader2, MessageSquare, Play, Radio, Sparkles } from 'lucide-react'
import type { SessionUiSnapshot, SessionVisualState } from '@/lib/learn/session-ui-state'
import { cn } from '@/lib/helpers'

const STATE_STYLES: Record<SessionVisualState, string> = {
  pre_session: 'bg-(--bg-tertiary) text-(--text-secondary)',
  connecting: 'bg-(--accent-soft) text-(--accent)',
  active_practice: 'bg-(--accent-soft) text-(--accent)',
  feedback: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  completed: 'bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-200',
}

function StateIcon({ state }: { state: SessionVisualState }) {
  if (state === 'connecting') return <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
  if (state === 'active_practice') return <Play className="h-3.5 w-3.5" aria-hidden="true" />
  if (state === 'feedback') return <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
  if (state === 'completed') return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
  return <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
}

export interface LearnSessionHeaderProps {
  snapshot: SessionUiSnapshot
  continuationHref?: string | null
  continuationLabel?: string | null
  tutorActive?: boolean
  planSheet?: React.ReactNode
}

export default function LearnSessionHeader({
  snapshot,
  continuationHref,
  continuationLabel,
  planSheet,
}: LearnSessionHeaderProps) {
  const showContinuationCta = snapshot.state === 'pre_session' && continuationHref && continuationLabel

  return (
    <header
      className="sticky top-16 z-30 border-b border-(--border-primary) bg-(--bg-primary)/95 backdrop-blur supports-[backdrop-filter]:bg-(--bg-primary)/85"
      style={{ ['--learn-session-header-height' as string]: '3.75rem' }}
      aria-label="Current learning session"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
              STATE_STYLES[snapshot.state],
            )}
          >
            <StateIcon state={snapshot.state} />
            {snapshot.stateBadgeLabel}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-(--text-muted)">
              <Radio className="mr-1 inline h-3 w-3" aria-hidden="true" />
              {snapshot.modeLabel}
            </p>
            <h2 className="truncate font-display text-sm font-black text-(--text-primary) sm:text-base">
              {snapshot.objectiveLabel}
            </h2>
            {snapshot.statusDetail && (
              <p className="truncate text-xs text-(--text-secondary)">{snapshot.statusDetail}</p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 sm:max-w-[45%] sm:justify-end">
          {planSheet}
          <p
            className="min-w-0 flex-1 text-xs font-semibold text-(--text-primary) sm:text-right"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-(--text-muted)">Next: </span>
            {snapshot.nextActionLabel}
          </p>
          {showContinuationCta && (
            <Link
              href={continuationHref}
              className="inline-flex shrink-0 items-center rounded-xl bg-(--accent) px-3 py-2 text-xs font-bold text-white no-underline hover:opacity-90"
            >
              {continuationLabel}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
