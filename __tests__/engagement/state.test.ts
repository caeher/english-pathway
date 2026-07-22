import { describe, expect, it } from 'vitest'
import { parseEngagementState } from '@/lib/dal/engagement'

describe('engagement state parsing', () => {
  it('keeps the activity and achievement XP breakdown returned by the database', () => {
    expect(parseEngagementState({
      xpAwarded: 42,
      activityXpAwarded: 17,
      achievementXpAwarded: 25,
      totalXp: 142,
      currentStreak: 3,
      longestStreak: 3,
      dailyMinutes: 4,
      dailyGoalMinutes: 10,
      newAchievementIds: ['perfect-activity'],
    })).toMatchObject({
      xpAwarded: 42,
      activityXpAwarded: 17,
      achievementXpAwarded: 25,
      totalXp: 142,
      newAchievementIds: ['perfect-activity'],
    })
  })

  it('remains compatible with a prior response that did not include the XP breakdown', () => {
    expect(parseEngagementState({ xpAwarded: 17 })).toMatchObject({
      xpAwarded: 17,
      activityXpAwarded: 17,
      achievementXpAwarded: 0,
    })
  })
})
