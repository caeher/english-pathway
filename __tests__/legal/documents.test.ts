import { describe, expect, it } from 'vitest'
import { analyticsEventSchema } from '@/lib/api/analytics-schemas'
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents'
import { getLegalOperatorConfig } from '@/lib/legal/operator'

describe('legal and privacy contracts', () => {
  it('publishes versioned documents without draft placeholders', () => {
    expect(LEGAL_DOCUMENTS).toHaveLength(3)
    for (const document of LEGAL_DOCUMENTS) {
      expect(document.version).toBe('1.2')
      expect(document.content).not.toContain('must be reviewed and approved')
      expect(document.content).not.toContain('placeholder must be replaced')
      expect(document.content).not.toContain('must be confirmed by the operator before launch')
      expect(document.content).toContain(getLegalOperatorConfig().privacyContactEmail)
    }
    expect(LEGAL_DOCUMENTS.find((document) => document.type === 'privacy')?.content).toContain('ElevenLabs')
    expect(LEGAL_DOCUMENTS.find((document) => document.type === 'privacy')?.content).toContain('English Assistant')
    expect(LEGAL_DOCUMENTS.find((document) => document.type === 'cookies')?.content).toContain('Allow analytics')
  })

  it('accepts only bounded, known analytics events', () => {
    expect(analyticsEventSchema.safeParse({ event_name: 'learn_session_start', properties: { mode: 'text' }, session_id: 'session-1' }).success).toBe(true)
    expect(analyticsEventSchema.safeParse({ event_name: 'learn_tool_call', properties: { tool: 'showActivity' }, session_id: 'session-1' }).success).toBe(true)
    expect(analyticsEventSchema.safeParse({ event_name: 'session_plan_select', properties: { plan: 'review' }, session_id: 'session-1' }).success).toBe(true)
    expect(analyticsEventSchema.safeParse({ event_name: 'unknown_private_event', properties: {} }).success).toBe(false)
    expect(analyticsEventSchema.safeParse({ event_name: 'activity_complete', properties: { transcript: 'x'.repeat(501) } }).success).toBe(false)
  })
})
