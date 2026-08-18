import { describe, expect, it } from 'vitest'
import {
  createClosedActivityOutcome,
  createSkippedActivityOutcome,
  formatActivityOutcomeMessage,
  toActivityOutcomeFromCompleteResult,
  type ActivityOutcome,
} from '@/lib/learn/activity-outcome'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'

describe('ActivityOutcome formatting and helpers', () => {
  it('formats completed activity outcome with 100% score', () => {
    const outcome: ActivityOutcome = {
      activityId: 'quiz-1',
      activityType: 'quiz',
      status: 'completed',
      score: 5,
      total: 5,
      scorePercent: 100,
      correctness: 'complete',
      attempts: 1,
      hintsUsed: 0,
    }

    const message = formatActivityOutcomeMessage(outcome)
    expect(message).toBe('I completed activity quiz-1 (quiz) with score 100%. Result: complete.')
  })

  it('formats completed activity outcome with partial score, weak items, and multiple attempts', () => {
    const outcome: ActivityOutcome = {
      activityId: 'listening-2',
      activityType: 'listening',
      status: 'completed',
      score: 3,
      total: 4,
      scorePercent: 75,
      correctness: 'partial',
      attempts: 2,
      hintsUsed: 1,
      weakItemIndexes: [1],
    }

    const message = formatActivityOutcomeMessage(outcome)
    expect(message).toBe('I completed activity listening-2 (listening) with score 75%. Result: partial. Attempts: 2. Hints used: 1. Weak items: 1.')
  })

  it('formats skipped activity outcome with polite prompt to tutor', () => {
    const outcome = createSkippedActivityOutcome({
      activityId: 'dictation-1',
      activityType: 'dictation',
      attempts: 1,
      hintsUsed: 2,
    })

    expect(outcome.status).toBe('skipped')
    expect(outcome.attempts).toBe(1)
    expect(outcome.hintsUsed).toBe(2)

    const message = formatActivityOutcomeMessage(outcome)
    expect(message).toContain('I skipped activity dictation-1 (dictation) without finishing.')
    expect(message).toContain('Attempts: 1.')
    expect(message).toContain('Hints used: 2.')
    expect(message).toContain('Please offer an alternative exercise or review the concept.')
  })

  it('formats closed activity outcome before completion', () => {
    const outcome = createClosedActivityOutcome({
      activityId: 'flashcard-3',
      activityType: 'flashcard',
      attempts: 1,
    })

    expect(outcome.status).toBe('closed')
    expect(outcome.attempts).toBe(1)

    const message = formatActivityOutcomeMessage(outcome)
    expect(message).toBe('I closed activity flashcard-3 (flashcard) before finishing. Attempts: 1.')
  })

  it('converts ActivityCompleteResult to normalized ActivityOutcome', () => {
    const result: ActivityCompleteResult = {
      activityId: 'word-match-1',
      activityType: 'word-match',
      score: 4,
      total: 4,
      scorePercent: 100,
      correctness: 'complete',
      chapterId: 'ch-intro',
      moduleId: 'mod-1',
    }

    const outcome = toActivityOutcomeFromCompleteResult(result, {
      attempts: 2,
      hintsUsed: 1,
      timeSpentSeconds: 45,
    })

    expect(outcome.activityId).toBe('word-match-1')
    expect(outcome.activityType).toBe('word-match')
    expect(outcome.status).toBe('completed')
    expect(outcome.score).toBe(4)
    expect(outcome.total).toBe(4)
    expect(outcome.scorePercent).toBe(100)
    expect(outcome.correctness).toBe('complete')
    expect(outcome.attempts).toBe(2)
    expect(outcome.hintsUsed).toBe(1)
    expect(outcome.timeSpentSeconds).toBe(45)
    expect(outcome.chapterId).toBe('ch-intro')
    expect(outcome.moduleId).toBe('mod-1')
  })
})
