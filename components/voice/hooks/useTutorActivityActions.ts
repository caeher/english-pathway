'use client'

import { useCallback, useRef } from 'react'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import { trackEvent } from '@/lib/analytics/events'
import { enqueueSrsItems } from '@/lib/srs/client'
import { fetchActivityById } from '@/lib/learn/client-tools'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { recordEngagementSession } from '@/lib/engagement/client'
import type { ActivityType } from '@/types'
import { saveActivityProgress } from '@/features/progress/client'
import { learnSessionActions } from '@/stores/useLearnSessionStore'
import { formatFollowUpTutorMessage } from '@/lib/learn/follow-up-planner'
import { saveTutorMemory } from '@/lib/tutor/client'
import { buildTutorHintRequest, type TutorHintContext } from '@/features/activities/hints'

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

  const onActivityComplete = useCallback((result: ActivityCompleteResult) => {
    const pct = result.scorePercent ?? Math.round((result.score / result.total) * 100)
    learnSessionActions.recordActivityResult({ activityId: result.activityId, scorePercent: pct, completedAt: new Date().toISOString() })
    const followUpMessage = result.followUpDecision
      ? formatFollowUpTutorMessage(result.followUpDecision)
      : `I finished activity ${result.activityId} (${result.activityType}) with ${pct}% score.`
    deliverMessage(followUpMessage)
    trackEvent('activity_complete', { activity_id: result.activityId, activity_type: result.activityType, score_percent: pct })
    if (result.chapterId && result.moduleId) {
      void saveActivityProgress({ activityId: result.activityId, activityType: result.activityType, chapterId: result.chapterId, moduleId: result.moduleId, status: 'completed', score: pct, attempts: 1 }).then((saved) => {
        if (!saved) trackEvent('learn_session_error', { operation: 'progress_save', reason: 'request_failed', activity_type: result.activityType })
      })
    }
    void recordEngagementSession({ activityId: result.activityId, activityType: result.activityType as ActivityType, scorePercent: pct }).then((update) => {
      if (!update) trackEvent('learn_session_error', { operation: 'engagement_record', reason: 'request_failed', activity_type: result.activityType })
    })
    void enqueueSrsItems(result.reviewContentRefs ?? []).then((enqueued) => {
      if (result.reviewContentRefs?.length && !enqueued) trackEvent('learn_session_error', { operation: 'review_enqueue', reason: 'request_failed', activity_type: result.activityType })
    }).catch(() => trackEvent('learn_session_error', { operation: 'review_enqueue', reason: 'request_failed', activity_type: result.activityType }))
    void saveTutorMemory({
      type: 'learner_memory',
      memoryKey: `activity:${result.activityId}`,
      content: `Activity ${result.activityId} completed with a score of ${pct} percent.`,
      source: 'activity_result',
    })
  }, [deliverMessage])

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

  return { onActivityComplete, onActivityDifficult, onQuestionAnswered, flushPendingMessages }
}
