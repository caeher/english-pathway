import { describe, expect, it } from 'vitest'
import { getReviewContentRefs } from '@/lib/srs/refs'
import type { ChapterActivity } from '@/types'

describe('getReviewContentRefs', () => {
  it('creates stable references for individual quiz questions', () => {
    const activity: ChapterActivity = {
      id: 'quiz-1', type: 'quiz', title: 'Quiz', description: '', props: {
        questions: [{ id: 'question-a', type: 'multiple-choice', question: 'Choose', options: ['A', 'B'], correct: 0 }],
      },
    }
    expect(getReviewContentRefs(activity)).toEqual(['quiz-1:quiz:question-a'])
  })

  it('creates one reference per flashcard', () => {
    const activity: ChapterActivity = {
      id: 'cards-1', type: 'flashcard', title: 'Cards', description: '', props: {
        cards: [{ id: 'cat', front: 'cat', back: 'gato' }, { id: 'dog', front: 'dog', back: 'perro' }],
      },
    }
    expect(getReviewContentRefs(activity)).toEqual(['cards-1:flashcard:cat', 'cards-1:flashcard:dog'])
  })
})
