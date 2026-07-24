'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import EngagementSummary from '@/components/engagement/EngagementSummary'
import type { SessionMode } from '@/components/voice/session-types'
import { resolveSessionUiState, shouldExpandEngagementMetrics } from '@/lib/learn/session-ui-state'
import type { ActivityUiPhase } from '@/lib/learn/session-ui-state'
import { useContinuation } from '@/lib/learn/use-continuation'
import { selectPanel, selectTutorState, useLearnSessionStore } from '@/stores/useLearnSessionStore'
import DynamicContentPanel from './DynamicContentPanel'
import LearnSessionHeader from './LearnSessionHeader'
import type { ActivityCompleteResult } from './ActivityRenderer'

interface LearnSessionLayoutProps {
  tutorSlot: React.ReactNode
  sessionMode?: SessionMode | null
  tutorActive?: boolean
  tutorConnecting?: boolean
  showEngagement?: boolean
  onActivityComplete?: (result: ActivityCompleteResult) => void
  onActivityDifficult?: (activityId: string) => void
  onQuestionAnswered?: (optionIndex: number, correct: boolean) => void
}

export default function LearnSessionLayout({
  tutorSlot,
  sessionMode = null,
  tutorActive = false,
  tutorConnecting = false,
  showEngagement = true,
  onActivityComplete,
  onActivityDifficult,
  onQuestionAnswered,
}: LearnSessionLayoutProps) {
  const panel = useLearnSessionStore(selectPanel)
  const tutorState = useLearnSessionStore(selectTutorState)
  const continuation = useContinuation()
  const [activityPhase, setActivityPhase] = useState<ActivityUiPhase | null>(null)
  const [questionAnswered, setQuestionAnswered] = useState(false)
  const [completionScorePercent, setCompletionScorePercent] = useState<number | null>(null)

  useEffect(() => {
    setQuestionAnswered(false)
    if (panel.kind !== 'activity') {
      setActivityPhase(null)
      setCompletionScorePercent(null)
    }
  }, [panel])

  const handleActivityPhaseChange = useCallback((phase: ActivityUiPhase) => {
    setActivityPhase(phase)
    if (phase !== 'completed') {
      setCompletionScorePercent(null)
    }
  }, [])

  const handleActivityComplete = useCallback((result: ActivityCompleteResult) => {
    const scorePercent = result.scorePercent ?? Math.round((result.score / result.total) * 100)
    setCompletionScorePercent(scorePercent)
    setActivityPhase('completed')
    onActivityComplete?.(result)
  }, [onActivityComplete])

  const handleQuestionAnswered = useCallback((optionIndex: number, correct: boolean) => {
    setQuestionAnswered(true)
    onQuestionAnswered?.(optionIndex, correct)
  }, [onQuestionAnswered])

  const snapshot = useMemo(() => resolveSessionUiState({
    sessionMode,
    tutorActive,
    tutorConnecting,
    tutorState,
    panel,
    activityPhase,
    questionAnswered,
    continuation,
    completionScorePercent,
  }), [
    sessionMode,
    tutorActive,
    tutorConnecting,
    tutorState,
    panel,
    activityPhase,
    questionAnswered,
    continuation,
    completionScorePercent,
  ])

  return (
    <div className="learn-session-shell mx-auto w-full max-w-6xl">
      <LearnSessionHeader
        snapshot={snapshot}
        continuationHref={continuation?.href}
        continuationLabel={continuation?.label}
      />
      {showEngagement && (
        <EngagementSummary defaultExpanded={shouldExpandEngagementMetrics(snapshot.state)} />
      )}
      <div className="flex min-h-[calc(100dvh-4rem-3.75rem)] flex-col divide-y divide-(--border-primary) lg:grid lg:min-h-[calc(100dvh-4rem-3.75rem)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <section className="min-h-[min(360px,calc(45dvh-env(safe-area-inset-bottom)))] max-h-[calc(45dvh-env(safe-area-inset-bottom))] overflow-y-auto bg-(--bg-secondary)/30 pb-[env(safe-area-inset-bottom)] lg:min-h-0 lg:max-h-none lg:pb-0">
          {tutorSlot}
        </section>
        <section className="min-h-[calc(42dvh-env(safe-area-inset-bottom))] flex-1 bg-(--bg-primary) pb-16 lg:min-h-0 lg:pb-0">
          <DynamicContentPanel
            onActivityComplete={handleActivityComplete}
            onActivityDifficult={onActivityDifficult}
            onQuestionAnswered={handleQuestionAnswered}
            onActivityPhaseChange={handleActivityPhaseChange}
          />
        </section>
      </div>
    </div>
  )
}
