import type { ActivityType } from '@/types'

export interface EngagementUpdate {
  xpAwarded: number
  activityXpAwarded: number
  achievementXpAwarded: number
  totalXp: number
  currentStreak: number
  longestStreak: number
  dailyMinutes: number
  dailyGoalMinutes: number
  newAchievementIds: string[]
  newAchievements: Array<{ id: string; title: string; icon: string }>
}

export async function recordEngagementSession(input: {
  activityId: string
  activityType: ActivityType
  scorePercent: number
}) {
  try {
    const response = await fetch('/api/engagement/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        durationMinutes: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      }),
    })
    if (!response.ok) return null
    const update = await response.json() as EngagementUpdate
    window.dispatchEvent(new CustomEvent<EngagementUpdate>('engagement:updated', { detail: update }))
    return update
  } catch {
    return null
  }
}
