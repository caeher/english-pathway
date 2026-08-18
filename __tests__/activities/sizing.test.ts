import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_ROUND_BOUNDS,
  getRoundBounds,
  sliceActivityPropsToRound,
  countActivityItems,
} from '@/features/activities/sizing'
import { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'
import type { ActivityTypeKey } from '@/features/activities/contracts'

describe('Activity Sizing Policies', () => {
  it('defines round bounds for all 10 activity types', () => {
    const types: ActivityTypeKey[] = [
      'flashcard',
      'word-match',
      'quiz',
      'sentence-builder',
      'word-scramble',
      'listening',
      'dictation',
      'pronunciation',
      'minimal-pairs',
      'branching-dialogue',
    ]

    for (const type of types) {
      const bounds = getRoundBounds(type)
      expect(bounds).toBeDefined()
      expect(bounds.min).toBeGreaterThanOrEqual(1)
      expect(bounds.max).toBeGreaterThanOrEqual(bounds.min)
      expect(bounds.target).toBeGreaterThanOrEqual(bounds.min)
      expect(bounds.target).toBeLessThanOrEqual(bounds.max)
    }

    // Specific target acceptance criteria
    expect(ACTIVITY_ROUND_BOUNDS.flashcard).toEqual({ min: 3, target: 4, max: 5 })
    expect(ACTIVITY_ROUND_BOUNDS['word-match']).toEqual({ min: 4, target: 5, max: 6 })
  })

  it('slices oversized flashcards to 3–5 cards per round', () => {
    const rawCards = Array.from({ length: 26 }, (_, i) => ({
      id: `c${i}`,
      front: `Word ${i}`,
      back: `Significado ${i}`,
    }))

    const round0 = sliceActivityPropsToRound('flashcard', { cards: rawCards }, { roundIndex: 0 })
    expect(round0.props.cards).toHaveLength(4)
    expect((round0.props.cards as typeof rawCards)[0].id).toBe('c0')
    expect(round0.roundMeta.currentRound).toBe(0)
    expect(round0.roundMeta.totalRounds).toBe(7)
    expect(round0.roundMeta.totalItems).toBe(26)

    const round1 = sliceActivityPropsToRound('flashcard', { cards: rawCards }, { roundIndex: 1 })
    expect(round1.props.cards).toHaveLength(4)
    expect((round1.props.cards as typeof rawCards)[0].id).toBe('c4')
  })

  it('slices oversized word-match to 4–6 pairs per round', () => {
    const rawPairs = Array.from({ length: 15 }, (_, i) => ({
      left: `Left ${i}`,
      right: `Right ${i}`,
    }))

    const round0 = sliceActivityPropsToRound('word-match', { pairs: rawPairs }, { roundIndex: 0 })
    expect(round0.props.pairs).toHaveLength(5)
    expect((round0.props.pairs as typeof rawPairs)[0].left).toBe('Left 0')
    expect(round0.roundMeta.totalRounds).toBe(3)

    const round1 = sliceActivityPropsToRound('word-match', { pairs: rawPairs }, { roundIndex: 1 })
    expect(round1.props.pairs).toHaveLength(5)
    expect((round1.props.pairs as typeof rawPairs)[0].left).toBe('Left 5')
  })

  it('prioritizes weak items in reinforcement slicing', () => {
    const rawCards = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      front: `Word ${i}`,
      back: `Significado ${i}`,
    }))

    // Learner was weak on items at index 7 and 9
    const reinforcement = sliceActivityPropsToRound(
      'flashcard',
      { cards: rawCards },
      { prioritizeItemIndexes: [7, 9] },
    )

    expect(reinforcement.props.cards).toHaveLength(4)
    const cards = reinforcement.props.cards as typeof rawCards
    expect(cards[0].id).toBe('c7')
    expect(cards[1].id).toBe('c9')
  })

  it('preserves small activity sets that already fit within round bounds', () => {
    const smallQuiz = {
      questions: [
        { id: 'q1', type: 'multiple-choice', question: 'Q1', options: ['A', 'B'], correct: 0 },
        { id: 'q2', type: 'multiple-choice', question: 'Q2', options: ['A', 'B'], correct: 1 },
        { id: 'q3', type: 'multiple-choice', question: 'Q3', options: ['A', 'B'], correct: 0 },
      ],
    }

    const res = sliceActivityPropsToRound('quiz', smallQuiz)
    expect(res.props.questions).toHaveLength(3)
    expect(res.roundMeta.totalRounds).toBe(1)
    expect(res.roundMeta.totalItems).toBe(3)
  })

  it('enforces bounds at the resolveActivityByIdValidated boundary', () => {
    // m1-ch1-flash has 30 cards in knowledge/
    const resolvedFlash = resolveActivityByIdValidated('m1-ch1-flash')
    expect(resolvedFlash).not.toBeNull()
    const cards = (resolvedFlash?.activity.props as { cards: unknown[] }).cards
    expect(cards.length).toBeGreaterThanOrEqual(3)
    expect(cards.length).toBeLessThanOrEqual(5)
    expect(resolvedFlash?.roundMeta?.totalItems).toBe(30)
    expect(resolvedFlash?.roundMeta?.totalRounds).toBeGreaterThan(1)

    // m1-ch1-match has 12 pairs in knowledge/
    const resolvedMatch = resolveActivityByIdValidated('m1-ch1-match')
    expect(resolvedMatch).not.toBeNull()
    const pairs = (resolvedMatch?.activity.props as { pairs: unknown[] }).pairs
    expect(pairs.length).toBeGreaterThanOrEqual(4)
    expect(pairs.length).toBeLessThanOrEqual(6)
  })

  it('correctly counts items for all activity types', () => {
    expect(countActivityItems('flashcard', { cards: [{}, {}, {}] })).toBe(3)
    expect(countActivityItems('word-match', { pairs: [{}, {}] })).toBe(2)
    expect(countActivityItems('quiz', { questions: [{}] })).toBe(1)
    expect(countActivityItems('sentence-builder', { sentences: [{}, {}] })).toBe(2)
    expect(countActivityItems('word-scramble', { words: [{}, {}, {}] })).toBe(3)
    expect(countActivityItems('listening', { items: [{}] })).toBe(1)
    expect(countActivityItems('dictation', { items: [{}] })).toBe(1)
    expect(countActivityItems('pronunciation', { items: [{}] })).toBe(1)
    expect(countActivityItems('minimal-pairs', { pairs: [{}, {}] })).toBe(2)
    expect(countActivityItems('branching-dialogue', { nodes: [{}, {}] })).toBe(1)
  })
})
