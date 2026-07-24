import { describe, expect, it } from 'vitest'
import { buildFlashcardRecallResult, getExplanationForAnswer } from '@/lib/games/flashcard-recall'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { validateActivityDocument, filterValidationErrors } from '@/features/activities'
import type { ChapterActivity } from '@/types'

describe('flashcard recall scoring', () => {
  it('scores recalled cards and tracks weak indexes', () => {
    const cardIds = ['a', 'b', 'c']
    const result = buildFlashcardRecallResult(cardIds, {
      a: 'recalled',
      b: 'unsure',
      c: 'missed',
    })

    expect(result.score).toBe(1)
    expect(result.total).toBe(3)
    expect(result.scorePercent).toBe(33)
    expect(result.weakItemIndexes).toEqual([1, 2])
    expect(result.metrics).toEqual({ recalled: 1, unsure: 1, missed: 1 })
  })

  it('returns 100% when every card is recalled', () => {
    const result = buildFlashcardRecallResult(['x', 'y'], { x: 'recalled', y: 'recalled' })
    expect(result.scorePercent).toBe(100)
    expect(result.weakItemIndexes).toEqual([])
  })
})

describe('quiz explanation helper', () => {
  it('uses the provided explanation when available', () => {
    expect(getExplanationForAnswer('Because B follows A.', 'option B')).toBe('Because B follows A.')
  })

  it('falls back to the correct answer text', () => {
    expect(getExplanationForAnswer(undefined, 'hello')).toBe('The correct answer is "hello".')
  })
})

describe('flashcard SRS references', () => {
  const flashcard: ChapterActivity = {
    id: 'review-flash',
    type: 'flashcard',
    title: 'Review flashcards',
    description: '',
    props: {
      cards: [
        { id: 'one', front: 'A', back: '1' },
        { id: 'two', front: 'B', back: '2' },
      ],
    },
  }

  it('enqueues only weak flashcards when item indexes are provided', () => {
    expect(getReviewContentRefs(flashcard, [1])).toEqual(['review-flash:flashcard:two'])
  })
})

describe('pilot chapter validation', () => {
  const pilotChapters = [
    { moduleId: 'modulo-1', chapterId: 'm1-ch1' },
    { moduleId: 'modulo-8', chapterId: 'm8-ch2' },
    { moduleId: 'modulo-13', chapterId: 'm13-ch1' },
  ]

  it.each(pilotChapters)('$moduleId/$chapterId passes structural validation', async ({ moduleId, chapterId }) => {
    const activities = (await import(`@/knowledge/modules/${moduleId}/chapters/${chapterId}/activities.json`)).default as unknown[]
    const issues = filterValidationErrors(activities.flatMap((activity, index) =>
      validateActivityDocument(moduleId, chapterId, activity, index)))
    expect(issues).toEqual([])
  })
})

describe('quiz contract bounds', () => {
  it('rejects out-of-range correct indexes', () => {
    const issues = validateActivityDocument('modulo-1', 'm1-ch1', {
      id: 'bad-quiz',
      type: 'quiz',
      title: 'Bad quiz',
      description: '',
      props: {
        questions: [{
          id: 'q1',
          type: 'multiple-choice',
          question: 'Pick one',
          options: ['A', 'B'],
          correct: 3,
        }],
      },
    }, 0)
    expect(filterValidationErrors(issues).some((issue) => issue.field.includes('correct'))).toBe(true)
  })

  it('rejects duplicate options', () => {
    const issues = validateActivityDocument('modulo-1', 'm1-ch1', {
      id: 'dup-quiz',
      type: 'quiz',
      title: 'Dup quiz',
      description: '',
      props: {
        questions: [{
          id: 'q1',
          type: 'multiple-choice',
          question: 'Pick one',
          options: ['A', 'A'],
          correct: 0,
        }],
      },
    }, 0)
    expect(filterValidationErrors(issues).some((issue) => issue.field.includes('options'))).toBe(true)
  })
})
