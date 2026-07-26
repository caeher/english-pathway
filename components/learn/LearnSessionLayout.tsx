'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import EngagementSummary from '@/components/engagement/EngagementSummary'
import type { SessionMode } from '@/components/voice/session-types'
import { resolveSessionVisualState, shouldExpandEngagementMetrics } from '@/lib/learn/session-ui-state'
import type { ActivityUiPhase } from '@/lib/learn/session-ui-state'
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
  onActivityDifficult?: (activityId: string, context?: import('@/features/activities/hints').TutorHintContext) => void
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

  const visualState = useMemo(() => resolveSessionVisualState({
    sessionMode,
    tutorActive,
    tutorConnecting,
    tutorState,
    panel,
    activityPhase,
    questionAnswered,
    completionScorePercent,
  }), [
    sessionMode,
    tutorActive,
    tutorConnecting,
    tutorState,
    panel,
    activityPhase,
    questionAnswered,
    completionScorePercent,
  ])

  // Height contract: shell fills viewport; header/metrics shrink; grid owns remaining space.
  // Desktop: two fixed columns, content panel is the sole scroll owner.
  // Mobile: keep the compact tutor controls short so the activity remains the primary area.
  return (
    <div className="learn-session-shell flex h-full min-h-0 w-full flex-col">
      <LearnSessionHeader />
      {showEngagement && (
        <div className="shrink-0">
          <EngagementSummary defaultExpanded={shouldExpandEngagementMetrics(visualState)} />
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col divide-y divide-(--border-primary) lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0 lg:overflow-hidden">
        <section className="min-h-[min(220px,calc(32dvh-env(safe-area-inset-bottom)))] max-h-[calc(32dvh-env(safe-area-inset-bottom))] overflow-y-auto bg-(--bg-secondary)/30 pb-[env(safe-area-inset-bottom)] lg:min-h-0 lg:max-h-none lg:overflow-hidden lg:pb-0">
          {tutorSlot}
        </section>
        <section className="min-h-[calc(55dvh-env(safe-area-inset-bottom))] flex-1 bg-(--bg-primary) pb-16 lg:h-full lg:min-h-0 lg:overflow-hidden lg:pb-0">
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
