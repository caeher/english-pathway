import { z } from 'zod'
import { engagementSessionSchema } from '@/lib/api/engagement-schemas'

export { engagementSessionSchema }
export type EngagementSessionInput = z.infer<typeof engagementSessionSchema>

export const timezoneQuerySchema = z.object({ timezone: z.string().min(1).max(100).default('UTC') })
export const engagementSessionResponseSchema = z.object({
  xpAwarded: z.number(),
  activityXpAwarded: z.number(),
  achievementXpAwarded: z.number(),
  totalXp: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  dailyMinutes: z.number(),
  dailyGoalMinutes: z.number(),
  newAchievementIds: z.array(z.string()),
  newAchievements: z.array(z.unknown()),
})
