import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityProgressInput, ChapterProgressInput } from '@/lib/api/progress-schemas'
import type { Database } from '@/lib/supabase/database.types'
import type { CurriculumProgressSnapshot } from '@/lib/curriculum/progress'

type Client = SupabaseClient<Database>
type ActivityRow = Database['public']['Tables']['activity_completions']['Row']

export interface LastProgress {
  user_id: string
  last_module_id: string | null
  last_chapter_id: string | null
  last_activity_id: string | null
  updated_at: string
}

interface ResolvedActivityProgress extends ActivityProgressInput {
  chapterId: string
  moduleId: string
}

interface ResolvedChapterProgress extends ChapterProgressInput {
  moduleId: string
}

async function saveLastProgress(
  supabase: Client,
  userId: string,
  values: Pick<LastProgress, 'last_module_id' | 'last_chapter_id' | 'last_activity_id'>
) {
  const { data: existing, error: readError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (readError) throw new Error(`Failed to load learning progress: ${readError.message}`)

  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      last_module_id: values.last_module_id ?? existing?.last_module_id ?? null,
      last_chapter_id: values.last_chapter_id ?? existing?.last_chapter_id ?? null,
      last_activity_id: values.last_activity_id ?? existing?.last_activity_id ?? null,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) throw new Error(`Failed to save learning progress: ${error.message}`)
  return data
}

export async function getLastProgress(supabase: Client, userId: string): Promise<LastProgress | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load learning progress: ${error.message}`)
  return data
}

export async function getCurriculumProgressSnapshot(
  supabase: Client,
  userId: string,
): Promise<CurriculumProgressSnapshot> {
  const [chapters, activities, lastProgress] = await Promise.all([
    supabase.from('chapter_completions').select('chapter_id').eq('user_id', userId),
    supabase
      .from('activity_completions')
      .select('activity_id, chapter_id, status, score, updated_at')
      .eq('user_id', userId),
    getLastProgress(supabase, userId),
  ])

  if (chapters.error) throw new Error(`Failed to load chapter completions: ${chapters.error.message}`)
  if (activities.error) throw new Error(`Failed to load activity progress: ${activities.error.message}`)

  return {
    completedChapterIds: new Set((chapters.data ?? []).map((row) => row.chapter_id)),
    activities: activities.data ?? [],
    lastChapterId: lastProgress?.last_chapter_id ?? null,
    lastActivityId: lastProgress?.last_activity_id ?? null,
  }
}

export async function recordActivityProgress(
  supabase: Client,
  userId: string,
  progress: ResolvedActivityProgress
) {
  const { data: existing, error: readError } = await supabase
    .from('activity_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_id', progress.activityId)
    .maybeSingle()
  if (readError) throw new Error(`Failed to load activity progress: ${readError.message}`)

  const status = existing?.status === 'completed' || progress.status === 'completed'
    ? 'completed'
    : progress.status
  const score = Math.max(existing?.score ?? 0, progress.score ?? 0)
  const attempts = Math.max(existing?.attempts ?? 0, progress.attempts ?? 0, 1)
  const completedAt = status === 'completed'
    ? existing?.completed_at ?? new Date().toISOString()
    : existing?.completed_at ?? null

  const { data, error } = await supabase
    .from('activity_completions')
    .upsert({
      user_id: userId,
      activity_id: progress.activityId,
      chapter_id: progress.chapterId,
      activity_type: progress.activityType ?? existing?.activity_type ?? null,
      status,
      score,
      attempts,
      completed_at: completedAt,
    }, { onConflict: 'user_id,activity_id' })
    .select('*')
    .single()
  if (error) throw new Error(`Failed to save activity progress: ${error.message}`)

  await saveLastProgress(supabase, userId, {
    last_module_id: progress.moduleId,
    last_chapter_id: progress.chapterId,
    last_activity_id: progress.activityId,
  })
  return data
}

export async function recordChapterProgress(
  supabase: Client,
  userId: string,
  progress: ResolvedChapterProgress
) {
  return saveLastProgress(supabase, userId, {
    last_module_id: progress.moduleId,
    last_chapter_id: progress.chapterId,
    last_activity_id: null,
  })
}

export async function mergeLearningProgress(
  supabase: Client,
  userId: string,
  activities: ResolvedActivityProgress[],
  chapters: ResolvedChapterProgress[],
  lastActivity: { activityId: string; chapterId: string; moduleId: string } | null
) {
  const activityMap = new Map<string, ResolvedActivityProgress>()
  for (const activity of activities) {
    const existing = activityMap.get(activity.activityId)
    activityMap.set(activity.activityId, existing ? {
      ...activity,
      status: existing.status === 'completed' || activity.status === 'completed' ? 'completed' : activity.status,
      score: Math.max(existing.score ?? 0, activity.score ?? 0),
      attempts: Math.max(existing.attempts ?? 0, activity.attempts ?? 0),
    } : activity)
  }

  for (const activity of activityMap.values()) {
    await recordActivityProgress(supabase, userId, activity)
  }

  const latestChapter = chapters.at(-1)
  if (latestChapter) await recordChapterProgress(supabase, userId, latestChapter)
  if (lastActivity) {
    await saveLastProgress(supabase, userId, {
      last_module_id: lastActivity.moduleId,
      last_chapter_id: lastActivity.chapterId,
      last_activity_id: lastActivity.activityId,
    })
  }

  return { activities: activityMap.size, chapters: chapters.length }
}

export type LearningActivityRow = ActivityRow
