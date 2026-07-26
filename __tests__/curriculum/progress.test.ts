import { describe, expect, it } from 'vitest'
import { getChapterProgress, getCompletableChapterIds, getLearningTarget, getModuleProgress } from '@/lib/curriculum/progress'
import type { Chapter, Module } from '@/types'

const defaultPolicy = { mode: 'score' as const, passThreshold: 70 }

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
    required: true,
    policy: defaultPolicy,
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
  it('derives chapter state from passed required activities', () => {
    const progress = getChapterProgress(chapter('chapter-1'), {
      completedChapterIds: new Set(),
      activities: [{ activity_id: 'a-1', chapter_id: 'chapter-1', status: 'completed', passed: true, score: 80 }],
      lastChapterId: null,
      lastActivityId: null,
    })

    expect(progress).toMatchObject({
      status: 'in_progress',
      passedRequiredActivities: 1,
      totalRequiredActivities: 2,
      completionPercent: 50,
      canComplete: false,
      nextActivityId: 'a-2',
      nextUnlockedActivityId: 'a-2',
    })
  })

  it('does not count completed-but-unpassed activities', () => {
    const progress = getChapterProgress(chapter('chapter-1'), {
      completedChapterIds: new Set(),
      activities: [{ activity_id: 'a-1', chapter_id: 'chapter-1', status: 'completed', passed: false, score: 50 }],
      lastChapterId: null,
      lastActivityId: null,
    })

    expect(progress.passedRequiredActivities).toBe(0)
    expect(progress.nextActivityId).toBe('a-1')
  })

  it('calculates module counts and resumes the last valid activity', () => {
    const snapshot = {
      completedChapterIds: new Set(['chapter-2']),
      activities: [
        { activity_id: 'a-1', chapter_id: 'chapter-1', status: 'completed' as const, passed: true },
        { activity_id: 'a-2', chapter_id: 'chapter-1', status: 'completed' as const, passed: true },
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

  it('selects only chapters whose required activities are all passed', () => {
    const first = chapter('chapter-1')
    const second = chapter('chapter-2', ['b-1'])
    expect(getCompletableChapterIds([first, second], {
      completedChapterIds: new Set(['chapter-2']),
      activities: [
        { activity_id: 'a-1', chapter_id: 'chapter-1', status: 'completed', passed: true },
        { activity_id: 'a-2', chapter_id: 'chapter-1', status: 'completed', passed: true },
        { activity_id: 'b-1', chapter_id: 'chapter-2', status: 'completed', passed: true },
      ],
      lastChapterId: 'chapter-1',
      lastActivityId: 'a-2',
    })).toEqual(['chapter-1'])
  })
})
