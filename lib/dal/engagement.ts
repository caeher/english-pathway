import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>

export interface EngagementState {
  xpAwarded: number
  totalXp: number
  currentStreak: number
  longestStreak: number
  dailyMinutes: number
  dailyGoalMinutes: number
  newAchievementIds: string[]
}

export async function recordEngagementSession(
  supabase: Client,
  input: { activityId: string; xp: number; minutes: number; localDate: string; score: number }
): Promise<EngagementState> {
  const { data, error } = await supabase.rpc('record_engagement_session', {
    p_activity_id: input.activityId,
    p_xp: input.xp,
    p_minutes: input.minutes,
    p_local_date: input.localDate,
    p_score: input.score,
  })
  if (error) throw new Error(`Failed to record engagement session: ${error.message}`)
  return parseEngagementState(data)
}

export async function getEngagementState(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from('user_engagement')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load engagement state: ${error.message}`)
  return data
}

export async function getDailyProgress(supabase: Client, userId: string, localDate: string) {
  const [{ data: profile, error: profileError }, { data: session, error: sessionError }] = await Promise.all([
    supabase.from('profiles').select('daily_goal_minutes').eq('id', userId).maybeSingle(),
    supabase.from('daily_sessions').select('*').eq('user_id', userId).eq('session_date', localDate).maybeSingle(),
  ])
  if (profileError) throw new Error(`Failed to load daily goal: ${profileError.message}`)
  if (sessionError) throw new Error(`Failed to load daily progress: ${sessionError.message}`)
  return {
    date: localDate,
    minutesStudied: session?.minutes_studied ?? 0,
    xpEarned: session?.xp_earned ?? 0,
    activitiesCompleted: session?.activities_completed ?? 0,
    dailyGoalMinutes: profile?.daily_goal_minutes ?? 10,
    goalMet: session?.goal_met ?? false,
  }
}

export async function getAchievements(supabase: Client, userId: string) {
  const [{ data: achievements, error: achievementsError }, { data: earned, error: earnedError }] = await Promise.all([
    supabase.from('achievements').select('*').order('category').order('xp_reward'),
    supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId),
  ])
  if (achievementsError) throw new Error(`Failed to load achievements: ${achievementsError.message}`)
  if (earnedError) throw new Error(`Failed to load earned achievements: ${earnedError.message}`)
  const earnedById = new Map((earned ?? []).map((item) => [item.achievement_id, item.earned_at]))
  return (achievements ?? []).map((achievement) => ({
    ...achievement,
    earned: earnedById.has(achievement.id),
    earnedAt: earnedById.get(achievement.id) ?? null,
  }))
}

export function parseEngagementState(value: Json): EngagementState {
  const state = value as Partial<EngagementState>
  return {
    xpAwarded: Number(state.xpAwarded ?? 0),
    totalXp: Number(state.totalXp ?? 0),
    currentStreak: Number(state.currentStreak ?? 0),
    longestStreak: Number(state.longestStreak ?? 0),
    dailyMinutes: Number(state.dailyMinutes ?? 0),
    dailyGoalMinutes: Number(state.dailyGoalMinutes ?? 10),
    newAchievementIds: Array.isArray(state.newAchievementIds) ? state.newAchievementIds.map(String) : [],
  }
}
