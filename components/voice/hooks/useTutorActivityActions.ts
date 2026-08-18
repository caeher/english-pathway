'use client'

import { useCallback, useRef } from 'react'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import {
  type ActivityOutcome,
  createClosedActivityOutcome,
  createSkippedActivityOutcome,
  formatActivityOutcomeMessage,
  toActivityOutcomeFromCompleteResult,
} from '@/lib/learn/activity-outcome'
import { fetchActivityById } from '@/lib/learn/client-tools'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { enqueueSrsItems } from '@/lib/srs/client'
import { recordActivityCompletionEffects } from '@/lib/learning/activity-completion-effects'
import { learnSessionActions } from '@/stores/useLearnSessionStore'
import { saveTutorMemory } from '@/lib/tutor/client'
import { buildTutorHintRequest, type TutorHintContext } from '@/features/activities/hints'
import { trackEvent } from '@/lib/analytics/events'

export function useTutorActivityActions(sendMessage?: (message: string) => boolean | void) {
  const pendingMessagesRef = useRef<string[]>([])

  const deliverMessage = useCallback((text: string) => {
    const sent = sendMessage?.(text)
    if (!sent) pendingMessagesRef.current.push(text)
    return sent
  }, [sendMessage])

  const flushPendingMessages = useCallback(() => {
    const queue = [...pendingMessagesRef.current]
    pendingMessagesRef.current = []
    for (const message of queue) sendMessage?.(message)
  }, [sendMessage])

  const onActivityOutcome = useCallback((outcome: ActivityOutcome) => {
    learnSessionActions.recordActivityOutcome(outcome)

    if (outcome.status === 'completed') {
      const pct = outcome.scorePercent ?? (typeof outcome.score === 'number' && typeof outcome.total === 'number' && outcome.total > 0 ? Math.round((outcome.score / outcome.total) * 100) : 100)
      learnSessionActions.recordActivityResult({
        activityId: outcome.activityId,
        scorePercent: pct,
        completedAt: new Date().toISOString(),
      })
    } else if (outcome.status === 'skipped') {
      const message = formatActivityOutcomeMessage(outcome)
      deliverMessage(message)
      trackEvent('activity_abandon', {
        activity_id: outcome.activityId,
        activity_type: outcome.activityType,
        attempts: outcome.attempts,
        hints_used: outcome.hintsUsed,
        reason: 'skipped',
      })
      void saveTutorMemory({
        type: 'learner_memory',
        memoryKey: `activity_skip:${outcome.activityId}`,
        content: `Learner skipped activity ${outcome.activityId} (${outcome.activityType}) on attempt ${outcome.attempts}.`,
        source: 'activity_result',
      })
    } else if (outcome.status === 'closed' || outcome.status === 'abandoned') {
      const message = formatActivityOutcomeMessage(outcome)
      deliverMessage(message)
      trackEvent('activity_abandon', {
        activity_id: outcome.activityId,
        activity_type: outcome.activityType,
        attempts: outcome.attempts,
        reason: 'closed',
      })
      void saveTutorMemory({
        type: 'learner_memory',
        memoryKey: `activity_close:${outcome.activityId}`,
        content: `Learner closed activity ${outcome.activityId} (${outcome.activityType}) before completion.`,
        source: 'activity_result',
      })
    }
  }, [deliverMessage])

  const onActivityComplete = useCallback((result: ActivityCompleteResult) => {
    const outcome = toActivityOutcomeFromCompleteResult(result)
    onActivityOutcome(outcome)
    void recordActivityCompletionEffects(result, {
      source: 'learn',
      notifyTutor: deliverMessage,
    })
  }, [deliverMessage, onActivityOutcome])

  const onActivitySkip = useCallback((params: {
    activityId: string
    activityType: string
    attempts?: number
    hintsUsed?: number
    chapterId?: string
    moduleId?: string
    reason?: string
  }) => {
    const outcome = createSkippedActivityOutcome(params)
    onActivityOutcome(outcome)
  }, [onActivityOutcome])

  const onActivityClose = useCallback((params: {
    activityId: string
    activityType: string
    attempts?: number
    hintsUsed?: number
    chapterId?: string
    moduleId?: string
  }) => {
    const outcome = createClosedActivityOutcome(params)
    onActivityOutcome(outcome)
  }, [onActivityOutcome])

  const onActivityDifficult = useCallback(async (activityId: string, hintContext?: TutorHintContext) => {
    try {
      const { activity } = await fetchActivityById(activityId)
      await enqueueSrsItems(getReviewContentRefs(activity))
      const message = hintContext
        ? buildTutorHintRequest(hintContext)
        : 'I need a graduated hint for the current activity. Do not reveal the answer yet.'
      const sent = deliverMessage(message)
      if (!sent && hintContext) {
        learnSessionActions.setHintFallbackRequest({ message, context: hintContext })
      }
      void saveTutorMemory({
        type: 'learner_memory',
        memoryKey: `help:${activityId}`,
        content: `Learner requested a graduated hint (level ${hintContext?.level ?? 'unknown'}) for this activity.`,
        source: 'help_request',
      })
    } catch {
      // SRS is an enhancement; learning remains usable when it is unavailable.
    }
  }, [deliverMessage])

  const onQuestionAnswered = useCallback((optionIndex: number, correct: boolean) => {
    const letter = String.fromCharCode(65 + optionIndex)
    deliverMessage(`I answered option ${letter} for the quick check. Correct: ${correct ? 'yes' : 'no'}.`)
  }, [deliverMessage])

  return {
    onActivityOutcome,
    onActivityComplete,
    onActivitySkip,
    onActivityClose,
    onActivityDifficult,
    onQuestionAnswered,
    flushPendingMessages,
  }
}
