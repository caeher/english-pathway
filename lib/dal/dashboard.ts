import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { getTodayDateString } from '@/lib/engagement/daily-goal'
import { resolveActivityByIdValidated } from '@/lib/learn/resolve-activity'
import { resolveChapter } from '@/lib/content/resolve'

type Client = SupabaseClient<Database>

export async function getDashboardData(supabase: Client, userId: string) {
  const today = getTodayDateString()
  const [profile, engagement, daily, progress, activities, chapters, due] = await Promise.all([
    supabase.from('profiles').select('full_name, daily_goal_minutes').eq('id', userId).maybeSingle(),
    supabase.from('user_engagement').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_sessions').select('*').eq('user_id', userId).eq('session_date', today).maybeSingle(),
    supabase.from('user_progress').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('activity_completions').select('activity_id, chapter_id, score, status, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5),
    supabase.from('chapter_completions').select('chapter_id, completed_at').eq('user_id', userId).order('completed_at', { ascending: false }).limit(5),
    supabase.from('srs_items').select('*', { count: 'exact', head: true }).eq('user_id', userId).lte('due_at', new Date().toISOString()),
  ])

  const errors = [profile, engagement, daily, progress, activities, chapters, due].filter((result) => result.error)
  if (errors.length > 0) throw new Error('Unable to load dashboard data.')

  const recentActivities = (activities.data ?? []).map((item) => {
    const resolved = resolveActivityByIdValidated(item.activity_id)
    return {
      id: item.activity_id,
      title: resolved?.activity.title ?? item.activity_id,
      chapterTitle: resolved?.chapter.title ?? item.chapter_id,
      score: item.score,
      status: item.status,
      updatedAt: item.updated_at,
    }
  })

  const lastChapter = progress.data?.last_chapter_id
    ? await resolveChapter(progress.data.last_chapter_id)
    : null

  return {
    profile: profile.data,
    engagement: engagement.data,
    daily: {
      minutes: daily.data?.minutes_studied ?? 0,
      goalMinutes: profile.data?.daily_goal_minutes ?? 10,
      goalMet: daily.data?.goal_met ?? false,
    },
    progress: progress.data,
    recentActivities,
    completedChapters: chapters.data?.length ?? 0,
    dueReviews: due.count ?? 0,
    lastChapter,
  }
}
