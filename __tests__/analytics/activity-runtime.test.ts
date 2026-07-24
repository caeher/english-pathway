import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createActivityRuntimeAnalyticsHandler } from '@/lib/analytics/activity-runtime'
import * as analyticsEvents from '@/lib/analytics/events'

describe('activity runtime analytics bridge', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('tracks lifecycle events without learner content fields', () => {
    const trackEvent = vi.spyOn(analyticsEvents, 'trackEvent').mockImplementation(() => {})
    const handler = createActivityRuntimeAnalyticsHandler({ chapterId: 'm1-ch1', moduleId: 'modulo-1' })

    handler({ type: 'started', activityId: 'm1-ch1-quiz', activityType: 'quiz' })
    handler({
      type: 'itemAnswered',
      activityId: 'm1-ch1-quiz',
      activityType: 'quiz',
      itemIndex: 0,
      correct: false,
    })
    handler({
      type: 'hintRequested',
      activityId: 'm1-ch1-quiz',
      activityType: 'quiz',
      level: 1,
      source: 'editorial',
    })
    handler({ type: 'abandoned', activityId: 'm1-ch1-quiz', activityType: 'quiz', reason: 'exit' })

    expect(trackEvent).toHaveBeenCalledWith('activity_started', expect.objectContaining({
      activity_id: 'm1-ch1-quiz',
      chapter_id: 'm1-ch1',
    }))
    expect(trackEvent).toHaveBeenCalledWith('activity_first_attempt', expect.objectContaining({
      item_index: 0,
      correct: false,
    }))
    expect(trackEvent).toHaveBeenCalledWith('activity_item_error', expect.objectContaining({ item_index: 0 }))
    expect(trackEvent).toHaveBeenCalledWith('hint_requested', expect.objectContaining({ level: 1 }))
    expect(trackEvent).toHaveBeenCalledWith('activity_abandon', expect.objectContaining({ reason: 'exit' }))

    const payloads = trackEvent.mock.calls.map((call) => call[1])
    for (const payload of payloads) {
      expect(JSON.stringify(payload)).not.toMatch(/transcript|audioText|answer/i)
    }
  })

  it('emits only one first-attempt event per item', () => {
    const trackEvent = vi.spyOn(analyticsEvents, 'trackEvent').mockImplementation(() => {})
    const handler = createActivityRuntimeAnalyticsHandler({ chapterId: 'm1-ch1', moduleId: 'modulo-1' })

    handler({ type: 'started', activityId: 'm1-ch1-quiz', activityType: 'quiz' })
    handler({
      type: 'itemAnswered',
      activityId: 'm1-ch1-quiz',
      activityType: 'quiz',
      itemIndex: 0,
      correct: false,
    })
    handler({
      type: 'itemAnswered',
      activityId: 'm1-ch1-quiz',
      activityType: 'quiz',
      itemIndex: 0,
      correct: true,
    })

    const firstAttempts = trackEvent.mock.calls.filter((call) => call[0] === 'activity_first_attempt')
    expect(firstAttempts).toHaveLength(1)
  })
})
