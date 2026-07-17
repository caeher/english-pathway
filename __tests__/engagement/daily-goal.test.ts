import { describe, expect, it } from 'vitest'
import { getLocalDateString } from '@/lib/engagement/daily-goal'

describe('timezone-aware engagement dates', () => {
  it('uses the learner timezone when a UTC date crosses midnight', () => {
    const now = new Date('2026-07-18T04:30:00.000Z')
    expect(getLocalDateString('America/El_Salvador', now)).toBe('2026-07-17')
    expect(getLocalDateString('Asia/Tokyo', now)).toBe('2026-07-18')
  })
})
