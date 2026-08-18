import { describe, expect, it } from 'vitest'
import {
  planFollowUpPractice,
  formatFollowUpTutorMessage,
  type ChapterActivityRef,
} from '@/lib/learn/follow-up-planner'

const chapterActivities: ChapterActivityRef[] = [
  { id: 'm1-ch1-flash', type: 'flashcard', title: 'Alphabet Flashcards' },
  { id: 'm1-ch1-match', type: 'word-match', title: 'Letter Word Match' },
  { id: 'm1-ch1-quiz', type: 'quiz', title: 'Alphabet Quiz' },
  { id: 'm1-ch1-listen', type: 'listening', title: 'Listening Drill' },
]

describe('Compact Activity Sequencing & Distributed Practice', () => {
  it('recommends next round when multi-round activity has remaining items', () => {
    const decision = planFollowUpPractice({
      currentActivityId: 'm1-ch1-flash',
      currentActivityType: 'flashcard',
      correctness: 'complete',
      scorePercent: 100,
      weakItemIndexes: [],
      attempt: 1,
      hintCount: 0,
      chapterActivities,
      completedActivityIds: new Set(),
      roundIndex: 0,
      totalRounds: 4,
    })

    expect(decision.action).toBe('advance')
    expect(decision.activityId).toBe('m1-ch1-flash')
    expect(decision.tutorPayload.nextRoundIndex).toBe(1)
    expect(decision.reason).toContain('round 2')

    const message = formatFollowUpTutorMessage(decision)
    expect(message).toContain('round 2')
  })

  it('advances to next activity when final round of activity is completed', () => {
    const decision = planFollowUpPractice({
      currentActivityId: 'm1-ch1-flash',
      currentActivityType: 'flashcard',
      correctness: 'complete',
      scorePercent: 100,
      weakItemIndexes: [],
      attempt: 1,
      hintCount: 0,
      chapterActivities,
      completedActivityIds: new Set(),
      roundIndex: 3,
      totalRounds: 4,
    })

    expect(decision.action).toBe('advance')
    expect(decision.activityId).toBe('m1-ch1-match')
  })

  it('targets weak items in follow-up payload on partial mastery', () => {
    const decision = planFollowUpPractice({
      currentActivityId: 'm1-ch1-match',
      currentActivityType: 'word-match',
      correctness: 'partial',
      scorePercent: 60,
      weakItemIndexes: [1, 3],
      attempt: 1,
      hintCount: 0,
      chapterActivities,
      completedActivityIds: new Set(['m1-ch1-flash']),
      roundIndex: 0,
      totalRounds: 2,
    })

    expect(decision.action).toBe('reinforce')
    expect(decision.tutorPayload.weakItemCount).toBe(2)
    expect(decision.tutorPayload.weakItemIndexes).toEqual([1, 3])
    expect(decision.reason).toContain('2 items need more practice')
  })

  it('suggests targeted retry with weak items note before 3 attempts', () => {
    const decision = planFollowUpPractice({
      currentActivityId: 'm1-ch1-quiz',
      currentActivityType: 'quiz',
      correctness: 'needs-practice',
      scorePercent: 40,
      weakItemIndexes: [0, 2],
      attempt: 1,
      hintCount: 0,
      chapterActivities,
      completedActivityIds: new Set(),
      roundIndex: 0,
      totalRounds: 1,
    })

    expect(decision.action).toBe('retry')
    expect(decision.activityId).toBe('m1-ch1-quiz')
    expect(decision.tutorPayload.weakItemIndexes).toEqual([0, 2])
    expect(decision.reason).toContain('Focusing on the 2 items to improve')
  })

  it('switches to simpler variant after multiple failed attempts', () => {
    const decision = planFollowUpPractice({
      currentActivityId: 'm1-ch1-quiz',
      currentActivityType: 'quiz',
      correctness: 'needs-practice',
      scorePercent: 30,
      weakItemIndexes: [0, 1, 2],
      attempt: 3,
      hintCount: 2,
      chapterActivities,
      completedActivityIds: new Set(),
    })

    expect(decision.action).toBe('variant')
    expect(decision.activityId).not.toBe('m1-ch1-quiz')
  })
})
