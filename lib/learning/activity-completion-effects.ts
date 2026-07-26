import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import { trackEvent } from '@/lib/analytics/events'
import { enqueueSrsItems } from '@/lib/srs/client'
import { recordEngagementSession } from '@/lib/engagement/client'
import { saveActivityAttempt } from '@/features/progress/client'
import { saveTutorMemory } from '@/lib/tutor/client'
import type { ActivityType } from '@/types'
import { formatFollowUpTutorMessage } from '@/lib/learn/follow-up-planner'
import { evaluateActivityApproval } from '@/lib/curriculum/approval'
import type { ChapterActivity } from '@/types'

export interface ActivityCompletionEffectsOptions {
  source: 'curriculum' | 'learn'
  activity?: ChapterActivity
  notifyTutor?: (message: string) => boolean | void
}

export async function recordActivityCompletionEffects(
  result: ActivityCompleteResult,
  options: ActivityCompletionEffectsOptions,
) {
  const pct = result.scorePercent ?? Math.round((result.score / result.total) * 100)
  const approval = options.activity
    ? evaluateActivityApproval(options.activity, { finished: true, scorePercent: pct })
    : { passed: pct >= 70, reason: 'score_threshold' as const }

  if (result.chapterId && result.moduleId) {
    const saved = await saveActivityAttempt({
      activityId: result.activityId,
      activityType: result.activityType,
      chapterId: result.chapterId,
      moduleId: result.moduleId,
      finished: true,
      score: result.score,
      total: result.total,
      scorePercent: pct,
      attempts: 1,
      passed: approval.passed,
    })
    if (!saved.ok) {
      trackEvent('learn_session_error', { operation: 'progress_save', reason: 'request_failed', activity_type: result.activityType })
    }
  }

  void recordEngagementSession({
    activityId: result.activityId,
    activityType: result.activityType as ActivityType,
    scorePercent: pct,
  }).then((update) => {
    if (!update) trackEvent('learn_session_error', { operation: 'engagement_record', reason: 'request_failed', activity_type: result.activityType })
  })

  void enqueueSrsItems(result.reviewContentRefs ?? []).then((enqueued) => {
    if (result.reviewContentRefs?.length && !enqueued) {
      trackEvent('learn_session_error', { operation: 'review_enqueue', reason: 'request_failed', activity_type: result.activityType })
    }
  }).catch(() => trackEvent('learn_session_error', { operation: 'review_enqueue', reason: 'request_failed', activity_type: result.activityType }))

  trackEvent('activity_complete', {
    activity_id: result.activityId,
    activity_type: result.activityType,
    score_percent: pct,
    source: options.source,
    passed: approval.passed,
  })

  if (options.source === 'learn') {
    const followUpMessage = result.followUpDecision
      ? formatFollowUpTutorMessage(result.followUpDecision)
      : `I finished activity ${result.activityId} (${result.activityType}) with ${pct}% score.`
    options.notifyTutor?.(followUpMessage)
    void saveTutorMemory({
      type: 'learner_memory',
      memoryKey: `activity:${result.activityId}`,
      content: `Activity ${result.activityId} completed with a score of ${pct} percent.`,
      source: 'activity_result',
    })
  }

  return approval
}
