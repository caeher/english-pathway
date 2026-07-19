import { describe, expect, it } from 'vitest'
import { getReviewContentRefs } from '@/lib/srs/refs'
import type { ChapterActivity } from '@/types'

const quiz: ChapterActivity = {
  id: 'review-quiz',
  type: 'quiz',
  title: 'Review quiz',
  description: '',
  props: {
    questions: [
      { id: 'one', type: 'multiple-choice', question: 'One?', options: ['A', 'B'], correct: 0 },
      { id: 'two', type: 'multiple-choice', question: 'Two?', options: ['A', 'B'], correct: 1 },
    ],
  },
}

describe('review content references', () => {
  it('returns every concept when an activity is incomplete without item-level feedback', () => {
    expect(getReviewContentRefs(quiz)).toEqual(['review-quiz:quiz:one', 'review-quiz:quiz:two'])
  })

  it('returns only the concepts missed by an activity with item-level feedback', () => {
    expect(getReviewContentRefs(quiz, [1])).toEqual(['review-quiz:quiz:two'])
  })
})
