import { describe, expect, it } from 'vitest'
import { mergeProgressSchema } from '@/features/progress/contracts'

describe('learning progress schemas', () => {
  it('accepts an empty merge for an authenticated user', () => {
    expect(mergeProgressSchema.parse({})).toEqual({
      activities: [],
      chapters: [],
    })
  })

  it('accepts activity and chapter progress with a resumable activity', () => {
    const result = mergeProgressSchema.parse({
      activities: [{
        activityId: 'activity-1',
        chapterId: 'chapter-1',
        moduleId: 'module-1',
        status: 'completed',
        score: 80,
        attempts: 2,
      }],
      chapters: [{ chapterId: 'chapter-1', moduleId: 'module-1', status: 'in_progress' }],
      lastActivity: { activityId: 'activity-1', chapterId: 'chapter-1', moduleId: 'module-1' },
    })

    expect(result.activities[0]?.status).toBe('completed')
    expect(result.lastActivity?.activityId).toBe('activity-1')
  })

  it('rejects unbounded activity attempts', () => {
    expect(mergeProgressSchema.safeParse({
      activities: [{ activityId: 'activity-1', status: 'completed', attempts: 1001 }],
    }).success).toBe(false)
  })
})
