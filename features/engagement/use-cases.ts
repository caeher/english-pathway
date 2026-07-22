import type { AuthenticatedContext } from '@/lib/api/context'
import { DomainError } from '@/lib/api/errors'
import { getAchievements, getDailyProgress, getEngagementState, recordEngagementSession } from '@/lib/dal/engagement'
import { getLocalDateString, isValidTimeZone } from '@/lib/engagement/daily-goal'
import { getActiveStreak } from '@/lib/engagement/streak'
import { getXpForActivity } from '@/lib/engagement/xp'
import { resolveActivityByIdValidated } from '@/features/learn'
import type { EngagementSessionInput } from './contracts'

export async function recordEngagementSessionUseCase(context: AuthenticatedContext, input: EngagementSessionInput) {
  if (!isValidTimeZone(input.timezone)) throw new DomainError('INVALID_INPUT', 'Invalid timezone')
  const resolved = resolveActivityByIdValidated(input.activityId)
  if (!resolved || resolved.activity.type !== input.activityType) throw new DomainError('NOT_FOUND', 'Activity not found')

  const state = await recordEngagementSession(context.supabase, {
    activityId: input.activityId,
    xp: getXpForActivity(resolved.activity.type, input.scorePercent),
    minutes: input.durationMinutes,
    localDate: getLocalDateString(input.timezone),
    score: input.scorePercent,
  })
  const achievements = await getAchievements(context.supabase, context.userId)
  return { ...state, newAchievements: achievements.filter((achievement) => state.newAchievementIds.includes(achievement.id)) }
}

export async function getDailyProgressUseCase(context: AuthenticatedContext, timezone: string) {
  if (!isValidTimeZone(timezone)) throw new DomainError('INVALID_INPUT', 'Invalid timezone')
  return getDailyProgress(context.supabase, context.userId, getLocalDateString(timezone))
}

export async function getStreakUseCase(context: AuthenticatedContext, timezone: string) {
  if (!isValidTimeZone(timezone)) throw new DomainError('INVALID_INPUT', 'Invalid timezone')
  const state = await getEngagementState(context.supabase, context.userId)
  const localDate = getLocalDateString(timezone)
  return {
    currentStreak: getActiveStreak(state?.current_streak ?? 0, state?.last_study_date ?? null, localDate),
    longestStreak: state?.longest_streak ?? 0,
    totalXp: state?.total_xp ?? 0,
    lastStudyDate: state?.last_study_date ?? null,
  }
}

export function getAchievementsUseCase(context: AuthenticatedContext) {
  return getAchievements(context.supabase, context.userId)
}
