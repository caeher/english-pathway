import { describe, expect, it, vi } from 'vitest'
import { nextReviewDate, sm2Update } from '@/lib/srs/sm2'

describe('sm2Update', () => {
  const initial = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 }

  it('resets a failed item to a one-day interval', () => {
    expect(sm2Update({ easeFactor: 1.3, intervalDays: 12, repetitions: 4 }, 1)).toEqual({
      easeFactor: 1.3,
      intervalDays: 1,
      repetitions: 0,
    })
  })

  it('uses one and three days for the first two successful repetitions', () => {
    const first = sm2Update(initial, 4)
    expect(first.intervalDays).toBe(1)
    expect(first.repetitions).toBe(1)
    expect(sm2Update(first, 4).intervalDays).toBe(3)
  })

  it('uses the current ease factor after the second repetition', () => {
    expect(sm2Update({ easeFactor: 2.5, intervalDays: 3, repetitions: 2 }, 5).intervalDays).toBe(8)
  })

  it('sets the next review date from the computed interval', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T10:00:00.000Z'))
    expect(nextReviewDate(3).toISOString()).toBe('2026-07-20T10:00:00.000Z')
    vi.useRealTimers()
  })
})
