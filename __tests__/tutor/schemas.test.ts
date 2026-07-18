import { describe, expect, it } from 'vitest'
import { curriculumContextActionSchema, showActivityActionSchema, showGrammarActionSchema } from '@/lib/tutor/schemas'
import { getLocalTutorMatches } from '@/lib/tutor/context'

describe('tutor tool contracts', () => {
  it('rejects unsafe or unbounded client tool payloads', () => {
    expect(showActivityActionSchema.safeParse({ activityId: '' }).success).toBe(false)
    expect(showGrammarActionSchema.safeParse({ markdown: '<script>alert(1)</script>' }).success).toBe(false)
    expect(curriculumContextActionSchema.safeParse({ query: 'x'.repeat(501) }).success).toBe(false)
  })

  it('accepts bounded curriculum lookups', () => {
    expect(curriculumContextActionSchema.parse({ query: 'past tense', chapterId: 'm1-ch1' })).toEqual({ query: 'past tense', chapterId: 'm1-ch1' })
  })

  it('provides a bounded local fallback when retrieval is unavailable', () => {
    const matches = getLocalTutorMatches('alphabet', undefined, 'm1-ch1', 2)
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.length).toBeLessThanOrEqual(2)
    expect(matches.every((match) => match.content.length <= 1800)).toBe(true)
  })
})
