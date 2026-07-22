import { describe, expect, it } from 'vitest'
import { getActiveStreak, getPreviousDateString } from '@/lib/engagement/streak'

describe('active streaks', () => {
  it('keeps a streak active when the learner studied today or yesterday', () => {
    expect(getActiveStreak(7, '2026-07-22', '2026-07-22')).toBe(7)
    expect(getActiveStreak(7, '2026-07-21', '2026-07-22')).toBe(7)
  })

  it('does not display a stale streak after a missed day', () => {
    expect(getActiveStreak(7, '2026-07-20', '2026-07-22')).toBe(0)
  })

  it('handles month and year boundaries', () => {
    expect(getPreviousDateString('2026-03-01')).toBe('2026-02-28')
    expect(getPreviousDateString('2026-01-01')).toBe('2025-12-31')
    expect(getActiveStreak(2, '2025-12-31', '2026-01-01')).toBe(2)
  })

  it('fails closed for malformed dates and invalid streak values', () => {
    expect(getPreviousDateString('2026-02-30')).toBeNull()
    expect(getActiveStreak(Number.NaN, '2026-07-22', '2026-07-22')).toBe(0)
    expect(getActiveStreak(3, '2026-07-22', 'not-a-date')).toBe(0)
  })
})
