import { describe, expect, it } from 'vitest'
import { getLearningContinuation } from '@/lib/learning/continuation'

describe('learning continuation', () => {
  it('prioritizes due review over a resumable activity', () => {
    expect(getLearningContinuation({ dueReviews: 2, resume: { moduleId: 'm1', chapterId: 'c1', activityId: 'a1' }, completedChapters: 0, totalChapters: 77 })).toMatchObject({ kind: 'review', href: '/review' })
  })
  it('preserves module, chapter, and activity context when resuming', () => {
    expect(getLearningContinuation({ dueReviews: 0, resume: { moduleId: 'm1', chapterId: 'c1', activityId: 'a1' }, completedChapters: 0, totalChapters: 77 })).toMatchObject({ kind: 'resume', href: '/learn?moduleId=m1&chapterId=c1&activityId=a1' })
  })
  it('distinguishes new and completed paths', () => {
    expect(getLearningContinuation({ dueReviews: 0, resume: null, completedChapters: 0, totalChapters: 77 }).kind).toBe('start')
    expect(getLearningContinuation({ dueReviews: 0, resume: null, completedChapters: 77, totalChapters: 77 }).kind).toBe('completed')
  })
})
