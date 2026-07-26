import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityAttemptInput, ActivityProgressInput, ChapterProgressInput } from '@/lib/api/progress-schemas'
import type { Database } from '@/lib/supabase/database.types'
import type { CurriculumProgressSnapshot, ProgressStatus } from '@/lib/curriculum/progress'

function toProgressStatus(status: string): ProgressStatus {
  if (status === 'completed' || status === 'in_progress' || status === 'not_started') return status
  return 'not_started'
}

type Client = SupabaseClient<Database>
type ActivityRow = Database['public']['Tables']['activity_completions']['Row']

export interface LastProgress {
  user_id: string
  last_module_id: string | null
  last_chapter_id: string | null
  last_activity_id: string | null
  updated_at: string
}

interface ResolvedActivityAttempt {
  activityId: string
  finished: boolean
  chapterId: string
  moduleId: string
  activityType: string
  passed: boolean
  status: ProgressStatus
  score: number | null
  scorePercent?: number
  total?: number
  attempts?: number
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

export async function getActivityCompletionStatus(
  supabase: Client,
  userId: string,
  activityId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('activity_completions')
    .select('passed')
    .eq('user_id', userId)
    .eq('activity_id', activityId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load activity completion: ${error.message}`)
  return data?.passed === true
}

export async function getCurriculumProgressSnapshot(
  supabase: Client,
  userId: string,
): Promise<CurriculumProgressSnapshot> {
  const [chapters, activities, lastProgress] = await Promise.all([
    supabase.from('chapter_completions').select('chapter_id').eq('user_id', userId),
    supabase
      .from('activity_completions')
      .select('activity_id, chapter_id, status, passed, score, attempts, updated_at')
      .eq('user_id', userId),
    getLastProgress(supabase, userId),
  ])

  if (chapters.error) throw new Error(`Failed to load chapter completions: ${chapters.error.message}`)
  if (activities.error) throw new Error(`Failed to load activity progress: ${activities.error.message}`)

  return {
    completedChapterIds: new Set((chapters.data ?? []).map((row) => row.chapter_id)),
    activities: (activities.data ?? []).map((row) => ({
      ...row,
      status: toProgressStatus(row.status),
    })),
    lastChapterId: lastProgress?.last_chapter_id ?? null,
    lastActivityId: lastProgress?.last_activity_id ?? null,
  }
}

export async function recordActivityAttempt(
  supabase: Client,
  userId: string,
  progress: ResolvedActivityAttempt
) {
  const { data: existing, error: readError } = await supabase
    .from('activity_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_id', progress.activityId)
    .maybeSingle()
  if (readError) throw new Error(`Failed to load activity progress: ${readError.message}`)

  const attempts = Math.max(existing?.attempts ?? 0, progress.attempts ?? 0, progress.finished ? 1 : 0)
  const score = progress.score === null
    ? existing?.score ?? null
    : Math.max(existing?.score ?? 0, progress.score ?? 0)
  const passed = existing?.passed === true || progress.passed
  const status: ProgressStatus = progress.finished || existing?.status === 'completed'
    ? 'completed'
    : 'in_progress'
  const completedAt = status === 'completed'
    ? existing?.completed_at ?? new Date().toISOString()
    : existing?.completed_at ?? null
  const lastAttemptAt = progress.finished ? new Date().toISOString() : existing?.last_attempt_at ?? null

  const { data, error } = await supabase
    .from('activity_completions')
    .upsert({
      user_id: userId,
      activity_id: progress.activityId,
      chapter_id: progress.chapterId,
      activity_type: progress.activityType ?? existing?.activity_type ?? null,
      status,
      passed,
      score,
      attempts,
      completed_at: completedAt,
      last_attempt_at: lastAttemptAt,
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

/** @deprecated Use recordActivityAttempt */
export async function recordActivityProgress(
  supabase: Client,
  userId: string,
  progress: ResolvedActivityAttempt,
) {
  return recordActivityAttempt(supabase, userId, progress)
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
  activities: ResolvedActivityAttempt[],
  chapters: ResolvedChapterProgress[],
  lastActivity: { activityId: string; chapterId: string; moduleId: string } | null
) {
  const activityMap = new Map<string, ResolvedActivityAttempt>()
  for (const activity of activities) {
    const existing = activityMap.get(activity.activityId)
    activityMap.set(activity.activityId, existing ? {
      ...activity,
      passed: existing.passed || activity.passed,
      score: Math.max(existing.score ?? 0, activity.score ?? 0),
      attempts: Math.max(existing.attempts ?? 0, activity.attempts ?? 0),
      finished: existing.finished || activity.finished,
      status: existing.status === 'completed' || activity.status === 'completed' ? 'completed' : activity.status,
    } : activity)
  }

  for (const activity of activityMap.values()) {
    await recordActivityAttempt(supabase, userId, activity)
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
