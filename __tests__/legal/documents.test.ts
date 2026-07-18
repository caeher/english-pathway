import { describe, expect, it } from 'vitest'
import { analyticsEventSchema } from '@/lib/api/analytics-schemas'
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents'

describe('legal and privacy contracts', () => {
  it('publishes versioned documents that describe current optional voice and analytics choices', () => {
    expect(LEGAL_DOCUMENTS).toHaveLength(3)
    for (const document of LEGAL_DOCUMENTS) {
      expect(document.version).toMatch(/^1\./)
      expect(document.content).toContain('review')
    }
    expect(LEGAL_DOCUMENTS.find((document) => document.type === 'privacy')?.content).toContain('ElevenLabs')
    expect(LEGAL_DOCUMENTS.find((document) => document.type === 'cookies')?.content).toContain('Allow analytics')
  })

  it('accepts only bounded, known analytics events', () => {
    expect(analyticsEventSchema.safeParse({ event_name: 'learn_session_start', properties: { mode: 'text' }, session_id: 'session-1' }).success).toBe(true)
    expect(analyticsEventSchema.safeParse({ event_name: 'unknown_private_event', properties: {} }).success).toBe(false)
    expect(analyticsEventSchema.safeParse({ event_name: 'activity_complete', properties: { transcript: 'x'.repeat(501) } }).success).toBe(false)
  })
})
