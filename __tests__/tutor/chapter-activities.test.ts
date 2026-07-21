import { describe, expect, it } from 'vitest'
import { getTutorChapterActivitiesUseCase } from '@/features/tutor'

describe('getTutorChapterActivitiesUseCase', () => {
  it('returns validated activities for a known chapter', async () => {
    const result = await getTutorChapterActivitiesUseCase('m1-ch1')
    expect(result.chapterId).toBe('m1-ch1')
    expect(result.activities.length).toBeGreaterThan(0)
    expect(result.activities[0]).toMatchObject({
      id: expect.any(String),
      type: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
    })
  })

  it('throws for unknown chapters', async () => {
    await expect(getTutorChapterActivitiesUseCase('missing-chapter')).rejects.toThrow()
  })
})
