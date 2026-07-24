import { describe, expect, it } from 'vitest'
import { loadAllModules } from '@/lib/knowledge/load-all'
import {
  ACTIVITY_RUNTIME_CONTRACT_VERSION,
  activityRegistry,
  getActivityDefinition,
  hasActivityCapability,
  validateActivityDocument,
  filterValidationErrors,
} from '@/features/activities'
import type { ActivityType } from '@/types'

const activityTypes: ActivityType[] = ['quiz', 'flashcard', 'word-match', 'sentence-builder', 'word-scramble', 'listening', 'dictation', 'pronunciation', 'branching-dialogue', 'minimal-pairs']

describe('activity behavior matrix', () => {
  it.each(activityTypes)('%s has the shared reset, retry, result, persistence, and review behavior', (type) => {
    expect(activityRegistry[type].behavior).toEqual({ reset: true, retry: true, result: true, persistence: true, review: true })
    expect(activityRegistry[type].contractVersion).toBe(ACTIVITY_RUNTIME_CONTRACT_VERSION)
    expect(hasActivityCapability(activityRegistry[type], 'keyboard')).toBe(true)
    expect(activityRegistry[type].snapshot.version).toBe(1)
    expect(typeof activityRegistry[type].snapshot.summarize).toBe('function')
  })

  it('has a valid curriculum fixture for every registered renderer', () => {
    const activities = loadAllModules().flatMap((module) => module.chapters.flatMap((chapter) => chapter.activities))
    for (const type of activityTypes) {
      const fixture = activities.find((activity) => activity.type === type)
      expect(fixture, `Missing curriculum fixture for ${type}`).toBeDefined()
      expect(filterValidationErrors(validateActivityDocument('fixture-module', 'fixture-chapter', fixture, 0))).toEqual([])
    }
  })

  it('rejects invalid activities and unavailable renderer combinations', () => {
    expect(validateActivityDocument('fixture-module', 'fixture-chapter', { id: 'bad', type: 'quiz', title: 'Bad', description: '', props: { questions: [] } }, 0)).not.toEqual([])
    expect(getActivityDefinition('not-a-game')).toBeNull()
  })
})
