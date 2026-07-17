import { describe, expect, it } from 'vitest'
import { completeChapterSchema } from '@/lib/api/curriculum-schemas'

describe('chapter completion payload', () => {
  it('accepts a chapter id', () => {
    expect(completeChapterSchema.parse({ chapterId: 'm1-ch1' })).toEqual({ chapterId: 'm1-ch1' })
  })

  it('rejects missing or oversized chapter ids', () => {
    expect(completeChapterSchema.safeParse({}).success).toBe(false)
    expect(completeChapterSchema.safeParse({ chapterId: 'a'.repeat(101) }).success).toBe(false)
  })
})
