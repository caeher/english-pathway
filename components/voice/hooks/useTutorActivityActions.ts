'use client'

import { useCallback } from 'react'
import { useConversation } from '@elevenlabs/react'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import { trackEvent } from '@/lib/analytics/events'
import { enqueueSrsItems } from '@/lib/srs/client'
import { fetchActivityById } from '@/lib/learn/client-tools'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { recordEngagementSession } from '@/lib/engagement/client'
import type { ActivityType } from '@/types'
import { saveActivityProgress } from '@/features/progress/client'
import { useLearnSessionStore } from '@/stores/useLearnSessionStore'
import { saveTutorMemory } from '@/lib/tutor/client'

export function useTutorActivityActions() {
  const { sendUserMessage } = useConversation()

  const onActivityComplete = useCallback((result: ActivityCompleteResult) => {
    const pct = result.scorePercent ?? Math.round((result.score / result.total) * 100)
    useLearnSessionStore.getState().recordActivityResult({ activityId: result.activityId, scorePercent: pct, completedAt: new Date().toISOString() })
    sendUserMessage(`I finished activity ${result.activityId} (${result.activityType}) with ${pct}% score.`)
    trackEvent('activity_complete', { activity_id: result.activityId, activity_type: result.activityType, score_percent: pct })
    if (result.chapterId && result.moduleId) {
      void saveActivityProgress({ activityId: result.activityId, activityType: result.activityType, chapterId: result.chapterId, moduleId: result.moduleId, status: 'completed', score: pct, attempts: 1 })
    }
    void recordEngagementSession({ activityId: result.activityId, activityType: result.activityType as ActivityType, scorePercent: pct })
    void enqueueSrsItems(result.reviewContentRefs ?? [])
    void saveTutorMemory({
      type: 'learner_memory',
      memoryKey: `activity:${result.activityId}`,
      content: `Activity ${result.activityId} completed with a score of ${pct} percent.`,
      source: 'activity_result',
    })
  }, [sendUserMessage])

  const onActivityDifficult = useCallback(async (activityId: string) => {
    try {
      const { activity } = await fetchActivityById(activityId)
      await enqueueSrsItems(getReviewContentRefs(activity))
      useLearnSessionStore.getState().requestHelp()
      sendUserMessage('I need a graduated hint for the current activity. Do not reveal the answer yet.')
      void saveTutorMemory({ type: 'learner_memory', memoryKey: `help:${activityId}`, content: 'Learner requested a graduated hint for this activity.', source: 'help_request' })
    } catch {
      // SRS is an enhancement; learning remains usable when it is unavailable.
    }
  }, [sendUserMessage])

  return { onActivityComplete, onActivityDifficult }
}
