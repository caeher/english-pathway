import { describe, expect, it } from 'vitest'
import { getLearningContinuation } from '@/lib/learning/continuation'

describe('learning continuation', () => {
  it('prioritizes due review over a resumable activity', () => {
    expect(getLearningContinuation({ dueReviews: 2, resume: { moduleId: 'm1', chapterId: 'c1', activityId: 'a1' }, completedChapters: 0, totalChapters: 77 })).toMatchObject({ kind: 'review', href: '/review' })
  })
  it('routes resume to the structured curriculum chapter', () => {
    expect(getLearningContinuation({ dueReviews: 0, resume: { moduleId: 'm1', chapterId: 'c1', activityId: 'a1' }, completedChapters: 0, totalChapters: 77 })).toMatchObject({
      kind: 'resume',
      href: '/curriculum/m1/c1',
      label: 'Continue chapter',
      target: { moduleId: 'm1', chapterId: 'c1', activityId: 'a1' },
    })
  })
  it('distinguishes new and completed paths', () => {
    expect(getLearningContinuation({ dueReviews: 0, resume: null, completedChapters: 0, totalChapters: 77 }).kind).toBe('start')
    expect(getLearningContinuation({ dueReviews: 0, resume: null, completedChapters: 77, totalChapters: 77 }).kind).toBe('completed')
  })
})
