import { describe, expect, it } from 'vitest'
import { evaluateActivityApproval } from '@/lib/curriculum/approval'

describe('chapter completion policy', () => {
  it('approves completion-mode activities after a valid finish', () => {
    const result = evaluateActivityApproval(
      { policy: { mode: 'completion' } },
      { finished: true },
    )
    expect(result).toEqual({ passed: true, reason: 'valid_completion' })
  })

  it('unlocks the next required exercise only after score threshold is met', () => {
    const flashcard = { policy: { mode: 'score' as const, passThreshold: 70 } }
    expect(evaluateActivityApproval(flashcard, { finished: true, scorePercent: 69 })).toMatchObject({
      passed: false,
      reason: 'below_threshold',
    })
    expect(evaluateActivityApproval(flashcard, { finished: true, scorePercent: 70 })).toMatchObject({
      passed: true,
      reason: 'score_threshold',
    })
  })
})
