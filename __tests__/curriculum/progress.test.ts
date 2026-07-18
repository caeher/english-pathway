import { describe, expect, it } from 'vitest'
import { getChapterProgress, getLearningTarget, getModuleProgress } from '@/lib/curriculum/progress'
import type { Chapter, Module } from '@/types'

const chapter = (id: string, activities = ['a-1', 'a-2']): Chapter => ({
  id,
  moduleId: 'module-1',
  number: 1,
  title: id,
  subtitle: 'Practice',
  icon: '📘',
  color: '#000',
  objectives: [],
  content: '',
  activities: activities.map((activityId) => ({
    id: activityId,
    type: 'quiz',
    title: activityId,
    description: '',
    props: {},
  })),
  xpReward: 10,
})

const curriculumModule: Module = {
  id: 'module-1',
  number: 1,
  title: 'Module',
  description: '',
  icon: '📘',
  color: '#000',
  chapters: [chapter('chapter-1'), chapter('chapter-2', [])],
}

describe('curriculum progress', () => {
  it('derives chapter state and completion without trusting client counts', () => {
    const progress = getChapterProgress(chapter('chapter-1'), {
      completedChapterIds: new Set(),
      activities: [{ activity_id: 'a-1', chapter_id: 'chapter-1', status: 'completed' }],
      lastChapterId: null,
      lastActivityId: null,
    })

    expect(progress).toMatchObject({
      status: 'in_progress',
      completedActivities: 1,
      totalActivities: 2,
      completionPercent: 50,
      canComplete: false,
      nextActivityId: 'a-2',
    })
  })

  it('calculates module counts and resumes the last valid activity', () => {
    const snapshot = {
      completedChapterIds: new Set(['chapter-2']),
      activities: [
        { activity_id: 'a-1', chapter_id: 'chapter-1', status: 'completed' as const },
        { activity_id: 'a-2', chapter_id: 'chapter-1', status: 'completed' as const },
      ],
      lastChapterId: 'chapter-1',
      lastActivityId: 'a-2',
    }

    expect(getModuleProgress(curriculumModule, snapshot)).toMatchObject({ completedChapters: 1, completionPercent: 50 })
    expect(getLearningTarget([curriculumModule], snapshot)).toEqual({ moduleId: 'module-1', chapterId: 'chapter-1', activityId: 'a-2' })
  })

  it('falls back to the first unfinished chapter for a new learner', () => {
    expect(getLearningTarget([curriculumModule], {
      completedChapterIds: new Set(),
      activities: [],
      lastChapterId: null,
      lastActivityId: null,
    })).toEqual({ moduleId: 'module-1', chapterId: 'chapter-1', activityId: 'a-1' })
  })
})
