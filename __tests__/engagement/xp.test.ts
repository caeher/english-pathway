import { describe, expect, it } from 'vitest'
import { getLevelProgress, getXpForActivity } from '@/lib/engagement/xp'

describe('engagement XP', () => {
  it('awards activity-type XP plus a score bonus', () => {
    expect(getXpForActivity('quiz', 100)).toBe(17)
    expect(getXpForActivity('dictation', 0)).toBe(14)
  })

  it('clamps invalid score values before calculating XP', () => {
    expect(getXpForActivity('quiz', -10)).toBe(12)
    expect(getXpForActivity('quiz', 150)).toBe(17)
    expect(getXpForActivity('quiz', Number.NaN)).toBe(12)
  })

  it('computes a level bar from total XP', () => {
    expect(getLevelProgress(245)).toEqual({
      level: 3,
      currentLevelXp: 200,
      nextLevelXp: 300,
      progressPct: 45,
    })
    expect(getLevelProgress(Number.NaN)).toMatchObject({ level: 1, currentLevelXp: 0, nextLevelXp: 100, progressPct: 0 })
  })
})
