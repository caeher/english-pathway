import { describe, expect, it } from 'vitest'
import {
  attachActivityContextSchema,
  conversationDetailSchema,
  conversationSummarySchema,
  createConversationSchema,
} from '@/features/english-assistant/contracts'
import { assistantRequestSchema } from '@/lib/english-assistant/schema'

describe('english assistant conversation contracts', () => {
  it('accepts conversation list summaries', () => {
    expect(conversationSummarySchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Grammar help',
      updatedAt: '2026-07-24T00:00:00.000Z',
      hasContext: true,
    })).toMatchObject({ hasContext: true })
  })

  it('accepts conversation detail payloads with messages', () => {
    expect(conversationDetailSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Grammar help',
      updatedAt: '2026-07-24T00:00:00.000Z',
      activityContext: null,
      messages: [{ role: 'user', content: 'Explain present simple.' }],
    }).messages).toHaveLength(1)
  })

  it('requires the final assistant request message to be from the user', () => {
    expect(assistantRequestSchema.safeParse({
      conversationId: '11111111-1111-4111-8111-111111111111',
      messages: [{ role: 'assistant', content: 'Hi' }],
    }).success).toBe(false)

    expect(assistantRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'Explain this activity.' }],
    }).success).toBe(true)
  })

  it('validates attachable activity context payloads', () => {
    expect(attachActivityContextSchema.safeParse({
      context: {
        activityId: 'activity-1',
        chapterId: 'chapter-1',
        moduleId: 'module-1',
        type: 'quiz',
        title: 'Quiz',
        instructions: 'Choose the correct answer.',
      },
    }).success).toBe(true)

    expect(createConversationSchema.safeParse({ title: '  New topic  ' }).success).toBe(true)
  })
})
