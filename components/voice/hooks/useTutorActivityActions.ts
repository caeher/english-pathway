'use client'

import { useCallback, useRef } from 'react'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import { fetchActivityById } from '@/lib/learn/client-tools'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { enqueueSrsItems } from '@/lib/srs/client'
import { recordActivityCompletionEffects } from '@/lib/learning/activity-completion-effects'
import { learnSessionActions } from '@/stores/useLearnSessionStore'
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
    void recordActivityCompletionEffects(result, {
      source: 'learn',
      notifyTutor: deliverMessage,
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
