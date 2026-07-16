import { describe, expect, it } from 'vitest'
import { scoreToPercent, starsFromPercent } from '@/lib/games/scoring'

describe('activity scoring', () => {
  it('computes percent scores', () => {
    expect(scoreToPercent(7, 10)).toBe(70)
  })

  it('maps percent to stars', () => {
    expect(starsFromPercent(95)).toBe(3)
    expect(starsFromPercent(40)).toBe(0)
  })
})
