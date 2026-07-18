import { describe, expect, it } from 'vitest'
import { tutorMemoryWriteSchema } from '@/lib/api/tutor-memory-schemas'

describe('private tutor memory contract', () => {
  it('rejects raw audio, transcript, and oversized private content', () => {
    expect(tutorMemoryWriteSchema.safeParse({
      type: 'session_summary',
      correlationId: 'session-1',
      state: 'closed',
      summary: 'Here is the full transcript of the session.',
    }).success).toBe(false)
    expect(tutorMemoryWriteSchema.safeParse({
      type: 'learner_memory',
      memoryKey: 'note',
      content: 'x'.repeat(2001),
      source: 'activity_result',
    }).success).toBe(false)
  })

  it('accepts an idempotent, bounded session summary', () => {
    expect(tutorMemoryWriteSchema.parse({
      type: 'session_summary',
      correlationId: 'session-1',
      state: 'closed',
      summary: 'Learner completed a short practice session.',
      lastActivityId: 'm1-ch1-quiz',
    })).toMatchObject({ type: 'session_summary', correlationId: 'session-1', state: 'closed' })
  })
})
