import { describe, expect, it } from 'vitest'
import { evaluateActivityApproval } from '@/lib/curriculum/approval'

const scoreActivity = {
  id: 'a-1',
  type: 'quiz' as const,
  title: 'Quiz',
  description: '',
  required: true,
  policy: { mode: 'score' as const, passThreshold: 70 },
  props: {},
}

const completionActivity = {
  ...scoreActivity,
  policy: { mode: 'completion' as const },
}

describe('evaluateActivityApproval', () => {
  it('passes score mode at threshold', () => {
    expect(evaluateActivityApproval(scoreActivity, { finished: true, scorePercent: 70 }).passed).toBe(true)
  })

  it('fails score mode below threshold', () => {
    expect(evaluateActivityApproval(scoreActivity, { finished: true, scorePercent: 69 }).passed).toBe(false)
  })

  it('passes completion mode on valid finish without score', () => {
    expect(evaluateActivityApproval(completionActivity, { finished: true }).passed).toBe(true)
  })

  it('fails incomplete attempts', () => {
    expect(evaluateActivityApproval(scoreActivity, { finished: false, scorePercent: 100 }).passed).toBe(false)
  })
})
