import { describe, expect, it } from 'vitest'
import { analyticsEventSchema } from '@/lib/api/analytics-schemas'
import { sanitizeAnalyticsProperties } from '@/lib/analytics/events'

describe('first-party observability privacy contract', () => {
  it('keeps operational fields while removing learner content and identifiers', () => {
    expect(sanitizeAnalyticsProperties({ operation: 'progress_save', reason: 'request_failed', transcript: 'private', email: 'learner@example.com' })).toEqual({ operation: 'progress_save', reason: 'request_failed' })
  })

  it('rejects direct analytics payloads with sensitive property names', () => {
    expect(analyticsEventSchema.safeParse({ event_name: 'learn_session_error', properties: { transcript: 'private' } }).success).toBe(false)
  })
})
