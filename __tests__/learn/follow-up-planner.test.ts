import { describe, expect, it } from 'vitest'
import {
  formatFollowUpTutorMessage,
  planFollowUpPractice,
  validateFollowUpActivityId,
  type ChapterActivityRef,
} from '@/lib/learn/follow-up-planner'

const chapterActivities: ChapterActivityRef[] = [
  { id: 'quiz-1', type: 'quiz', title: 'Grammar Quiz' },
  { id: 'flash-1', type: 'flashcard', title: 'Vocabulary Cards' },
  { id: 'match-1', type: 'word-match', title: 'Word Match' },
  { id: 'listen-1', type: 'listening', title: 'Listening Drill' },
]

const completed = new Set<string>()

function plan(overrides: Partial<Parameters<typeof planFollowUpPractice>[0]> = {}) {
  return planFollowUpPractice({
    currentActivityId: 'quiz-1',
    currentActivityType: 'quiz',
    correctness: 'complete',
    scorePercent: 100,
    weakItemIndexes: [],
    attempt: 1,
    hintCount: 0,
    chapterActivities,
    completedActivityIds: completed,
    ...overrides,
  })
}

describe('validateFollowUpActivityId', () => {
  it('accepts ids present in the chapter list', () => {
    expect(validateFollowUpActivityId('flash-1', chapterActivities)).toBe(true)
  })

  it('rejects ids outside the chapter list', () => {
    expect(validateFollowUpActivityId('missing-activity', chapterActivities)).toBe(false)
    expect(validateFollowUpActivityId(null, chapterActivities)).toBe(false)
  })
})

describe('planFollowUpPractice', () => {
  it('recommends advance for a complete outcome', () => {
    const decision = plan({ correctness: 'complete', scorePercent: 100 })
    expect(decision.action).toBe('advance')
    expect(decision.activityId).toBe('flash-1')
    expect(validateFollowUpActivityId(decision.activityId, chapterActivities)).toBe(true)
  })

  it('recommends reinforce for a partial outcome with weak items', () => {
    const decision = plan({
      correctness: 'partial',
      scorePercent: 75,
      weakItemIndexes: [0, 2],
    })
    expect(decision.action).toBe('reinforce')
    expect(decision.activityId).not.toBe('quiz-1')
    expect(validateFollowUpActivityId(decision.activityId, chapterActivities)).toBe(true)
    expect(decision.reason).toContain('need more practice')
  })

  it('recommends retry on the first low-mastery attempt', () => {
    const decision = plan({
      correctness: 'needs-practice',
      scorePercent: 40,
      attempt: 1,
    })
    expect(decision.action).toBe('retry')
    expect(decision.activityId).toBe('quiz-1')
  })

  it('recommends a variant after repeated low-mastery attempts', () => {
    const decision = plan({
      correctness: 'needs-practice',
      scorePercent: 35,
      attempt: 3,
      hintCount: 1,
    })
    expect(decision.action).toBe('variant')
    expect(decision.activityId).not.toBe('quiz-1')
    expect(validateFollowUpActivityId(decision.activityId, chapterActivities)).toBe(true)
  })

  it('returns chapter-complete when no candidates remain', () => {
    const decision = plan({
      correctness: 'complete',
      completedActivityIds: new Set(chapterActivities.map((activity) => activity.id)),
    })
    expect(decision.action).toBe('chapter-complete')
    expect(decision.activityId).toBeNull()
  })

  it('is deterministic for the same input', () => {
    const input = {
      currentActivityId: 'listen-1',
      currentActivityType: 'listening',
      correctness: 'partial' as const,
      scorePercent: 72,
      weakItemIndexes: [1],
      attempt: 2,
      hintCount: 0,
      chapterActivities,
      completedActivityIds: new Set(['quiz-1']),
    }
    expect(planFollowUpPractice(input)).toEqual(planFollowUpPractice(input))
  })
})

describe('formatFollowUpTutorMessage', () => {
  it('includes structured follow-up fields', () => {
    const decision = plan({ correctness: 'partial', scorePercent: 72, weakItemIndexes: [1] })
    const message = formatFollowUpTutorMessage(decision)
    expect(message).toContain('Follow-up decision:')
    expect(message).toContain('reinforce')
    expect(message).toContain('score 72%')
    expect(message).toContain('weak items 1')
  })
})
