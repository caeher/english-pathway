import { describe, expect, it } from 'vitest'
import { evaluateActivityApproval } from '@/lib/curriculum/approval'

describe('backfill approval rules', () => {
  const activity = {
    id: 'm1-ch1-quiz',
    type: 'quiz' as const,
    title: 'Quiz',
    description: '',
    required: true,
    policy: { mode: 'score' as const, passThreshold: 70 },
    props: {},
  }

  it('does not auto-pass completed rows below threshold', () => {
    expect(evaluateActivityApproval(activity, { finished: true, scorePercent: 50 }).passed).toBe(false)
  })

  it('passes completed rows at threshold during backfill', () => {
    expect(evaluateActivityApproval(activity, { finished: true, scorePercent: 72 }).passed).toBe(true)
  })
})
