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

  it('creates stable references for branching dialogue decision nodes', () => {
    const activity: ChapterActivity = {
      id: 'dialogue-1',
      type: 'branching-dialogue',
      title: 'Dialogue',
      description: '',
      props: {
        setting: 'Office',
        startNodeId: 'n1',
        nodes: [
          {
            id: 'n1',
            intention: 'Greet',
            prompt: 'Hello',
            choices: [
              { id: 'a', text: 'Hi', nextNodeId: 'n2', pragmaticRating: 'optimal', explanation: 'Good' },
              { id: 'b', text: 'Yo', nextNodeId: 'n2', pragmaticRating: 'inappropriate', explanation: 'Too casual' },
            ],
          },
          {
            id: 'n2',
            intention: 'Close',
            prompt: 'Bye',
            choices: [
              { id: 'c', text: 'See you', nextNodeId: 'end', pragmaticRating: 'optimal', explanation: 'Polite' },
              { id: 'd', text: 'Later', nextNodeId: 'end', pragmaticRating: 'acceptable', explanation: 'Informal' },
            ],
          },
          { id: 'end', intention: 'Done', prompt: 'Finished', isTerminal: true, choices: [] },
        ],
      },
    }
    expect(getReviewContentRefs(activity, [1])).toEqual(['dialogue-1:dialogue:n2'])
  })

  it('creates stable references for minimal-pairs items', () => {
    const activity: ChapterActivity = {
      id: 'pairs-1',
      type: 'minimal-pairs',
      title: 'Pairs',
      description: '',
      props: {
        pairs: [
          {
            id: 'mp1',
            label: 'Contrast',
            wordA: 'ship',
            wordB: 'chip',
            phoneme: '/ʃ/ vs /tʃ/',
            tip: 'Tip',
            meaningA: 'boat',
          },
          {
            id: 'mp2',
            label: 'Contrast',
            wordA: 'ice',
            wordB: 'eyes',
            phoneme: '/s/ vs /z/',
            tip: 'Tip',
            meaningB: 'sight',
          },
        ],
      },
    }
    expect(getReviewContentRefs(activity)).toEqual(['pairs-1:minimal-pair:mp1', 'pairs-1:minimal-pair:mp2'])
    expect(getReviewContentRefs(activity, [0])).toEqual(['pairs-1:minimal-pair:mp1'])
  })
})
