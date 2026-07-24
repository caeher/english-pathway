import type { ActivityRuntimeEvent } from '@/features/activities/runtime-contract'
import { trackEvent } from '@/lib/analytics/events'

export interface ActivityRuntimeAnalyticsContext {
  chapterId?: string | null
  moduleId?: string | null
}

function baseProperties(
  context: ActivityRuntimeAnalyticsContext,
  activityId: string,
  activityType: string,
) {
  return {
    activity_id: activityId,
    activity_type: activityType,
    chapter_id: context.chapterId ?? null,
    module_id: context.moduleId ?? null,
  }
}

export function createActivityRuntimeAnalyticsHandler(context: ActivityRuntimeAnalyticsContext) {
  const attemptedItems = new Set<string>()

  return (event: ActivityRuntimeEvent) => {
    switch (event.type) {
      case 'started':
        attemptedItems.clear()
        trackEvent('activity_started', baseProperties(context, event.activityId, event.activityType))
        return
      case 'itemAnswered': {
        const itemKey = `${event.activityId}:${event.itemIndex}`
        if (!attemptedItems.has(itemKey)) {
          attemptedItems.add(itemKey)
          trackEvent('activity_first_attempt', {
            ...baseProperties(context, event.activityId, event.activityType),
            item_index: event.itemIndex,
            correct: event.correct,
          })
        }
        if (!event.correct) {
          trackEvent('activity_item_error', {
            ...baseProperties(context, event.activityId, event.activityType),
            item_index: event.itemIndex,
          })
        }
        return
      }
      case 'hintRequested':
        trackEvent('hint_requested', {
          ...baseProperties(context, event.activityId, event.activityType),
          level: event.level,
          item_index: event.itemIndex ?? null,
          source: event.source ?? 'editorial',
        })
        return
      case 'abandoned':
        trackEvent('activity_abandon', {
          ...baseProperties(context, event.activityId, event.activityType),
          reason: event.reason,
        })
        return
      case 'completed':
        return
      default:
        return
    }
  }
}

export function trackActivityRetry(
  context: ActivityRuntimeAnalyticsContext,
  activityId: string,
  activityType: string,
) {
  trackEvent('activity_retry', {
    ...baseProperties(context, activityId, activityType),
  })
}
