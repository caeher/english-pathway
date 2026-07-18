import { describe, expect, it } from 'vitest'
import { getLevelProgress } from '@/lib/engagement/xp'

describe('learner dashboard data', () => {
  it('exposes a stable level calculation for server-rendered XP', () => {
    expect(getLevelProgress(0).level).toBe(1)
    expect(getLevelProgress(100).level).toBe(2)
    expect(getLevelProgress(180).progressPct).toBe(80)
  })
})
