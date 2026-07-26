import { DomainError } from '@/lib/api/errors'
import type { AuthenticatedContext } from '@/lib/api/context'
import type { ActivityAttemptInput, ActivityProgressInput, ChapterProgressInput, MergeProgressInput } from './contracts'
import { resolveActivityByIdValidated } from '@/features/learn'
import { curriculumChapterHref, getChapterProgress, getCompletableChapterIds, getLearningTarget, getModuleProgress, resolveAllModules, resolveChapter } from '@/features/curriculum'
import { evaluateActivityApproval } from '@/lib/curriculum/approval'
import {
  completeChapter,
  getCurriculumProgressSnapshot,
  getLastProgress,
  mergeLearningProgress,
  recordActivityAttempt,
  recordChapterProgress,
} from './server'
import { getDueCount } from '@/lib/dal/srs'
import { getLearningContinuation } from '@/lib/learning/continuation'

async function completeEligibleChapters(context: AuthenticatedContext, chapterIds: Iterable<string>) {
  const uniqueChapterIds = [...new Set(chapterIds)]
  if (uniqueChapterIds.length === 0) return []

  const resolvedChapters = (await Promise.all(uniqueChapterIds.map(resolveChapter)))
    .filter((resolved): resolved is NonNullable<typeof resolved> => resolved !== null)
  const snapshot = await getCurriculumProgressSnapshot(context.supabase, context.userId)
  const eligibleIds = new Set(getCompletableChapterIds(
    resolvedChapters.map((resolved) => resolved.chapter),
    snapshot,
  ))

  await Promise.all(
    resolvedChapters
      .filter((resolved) => eligibleIds.has(resolved.chapter.id))
      .map((resolved) => completeChapter(context.supabase, context.userId, resolved.chapter.id)),
  )
  return [...eligibleIds]
}

function resolveScorePercent(input: ActivityAttemptInput): number | undefined {
  if (typeof input.scorePercent === 'number') return input.scorePercent
  if (typeof input.score === 'number' && typeof input.total === 'number' && input.total > 0) {
    return Math.round((input.score / input.total) * 100)
  }
  if (typeof input.score === 'number') return input.score
  return undefined
}

export async function saveActivityAttemptUseCase(context: AuthenticatedContext, input: ActivityAttemptInput) {
  const resolved = resolveActivityByIdValidated(input.activityId)
  if (!resolved || (input.chapterId && input.chapterId !== resolved.chapter.id)) {
    throw new DomainError('NOT_FOUND', 'Activity not found')
  }

  const scorePercent = resolveScorePercent(input)
  const approval = evaluateActivityApproval(resolved.activity, {
    finished: input.finished,
    scorePercent,
  })

  const progress = await recordActivityAttempt(context.supabase, context.userId, {
    ...input,
    chapterId: resolved.chapter.id,
    moduleId: resolved.module.id,
    activityType: resolved.activity.type,
    passed: approval.passed,
    status: input.finished ? 'completed' : 'in_progress',
    score: scorePercent ?? null,
  })

  await completeEligibleChapters(context, [resolved.chapter.id])
  return { progress, approval }
}

export async function saveActivityProgressUseCase(context: AuthenticatedContext, input: ActivityProgressInput) {
  return saveActivityAttemptUseCase(context, input)
}

export async function saveChapterProgressUseCase(context: AuthenticatedContext, input: ChapterProgressInput) {
  const resolved = await resolveChapter(input.chapterId)
  if (!resolved || (input.moduleId && input.moduleId !== resolved.module.id)) {
    throw new DomainError('NOT_FOUND', 'Chapter not found')
  }

  if (input.status === 'completed') {
    throw new DomainError('CONFLICT', 'Chapter completion is derived from approved exercises and cannot be set manually.')
  }

  return recordChapterProgress(context.supabase, context.userId, {
    ...input,
    moduleId: resolved.module.id,
  })
}

async function resolveMergeInput(input: MergeProgressInput) {
  const activities = []
  for (const activity of input.activities) {
    const resolved = resolveActivityByIdValidated(activity.activityId)
    if (!resolved || (activity.chapterId && activity.chapterId !== resolved.chapter.id)) {
      throw new DomainError('INVALID_INPUT', `Activity not found: ${activity.activityId}`)
    }
    const scorePercent = resolveScorePercent(activity)
    const approval = evaluateActivityApproval(resolved.activity, {
      finished: activity.finished,
      scorePercent,
    })
    activities.push({
      ...activity,
      chapterId: resolved.chapter.id,
      moduleId: resolved.module.id,
      activityType: resolved.activity.type,
      passed: approval.passed,
      status: activity.finished ? 'completed' as const : 'in_progress' as const,
      score: scorePercent ?? null,
    })
  }

  const chapters = []
  for (const chapter of input.chapters) {
    const resolved = await resolveChapter(chapter.chapterId)
    if (!resolved || (chapter.moduleId && chapter.moduleId !== resolved.module.id)) {
      throw new DomainError('INVALID_INPUT', `Chapter not found: ${chapter.chapterId}`)
    }
    if (chapter.status === 'completed') {
      throw new DomainError('CONFLICT', `Chapter completion cannot be merged manually: ${chapter.chapterId}`)
    }
    chapters.push({ ...chapter, moduleId: resolved.module.id })
  }

  let lastActivity: { activityId: string; chapterId: string; moduleId: string } | null = null
  if (input.lastActivity) {
    const resolved = resolveActivityByIdValidated(input.lastActivity.activityId)
    if (!resolved) throw new DomainError('INVALID_INPUT', 'Last activity not found')
    lastActivity = { activityId: resolved.activity.id, chapterId: resolved.chapter.id, moduleId: resolved.module.id }
  }
  return { activities, chapters, lastActivity }
}

export async function mergeProgressUseCase(context: AuthenticatedContext, input: MergeProgressInput) {
  const { activities, chapters, lastActivity } = await resolveMergeInput(input)
  const result = await mergeLearningProgress(context.supabase, context.userId, activities, chapters, lastActivity)
  await completeEligibleChapters(context, activities.map((activity) => activity.chapterId))
  return result
}

export async function getLastProgressUseCase(context: AuthenticatedContext) {
  const progress = await getLastProgress(context.supabase, context.userId)
  if (!progress) return null
  const resolvedActivity = progress.last_activity_id ? resolveActivityByIdValidated(progress.last_activity_id) : null
  const resolvedChapter = progress.last_chapter_id ? await resolveChapter(progress.last_chapter_id) : null
  const chapter = resolvedActivity?.chapter ?? resolvedChapter?.chapter
  const resolvedModule = resolvedActivity?.module ?? resolvedChapter?.module
  return {
    ...progress,
    activityTitle: resolvedActivity?.activity.title ?? null,
    chapterTitle: chapter?.title ?? null,
    moduleTitle: resolvedModule?.title ?? null,
    curriculumUrl: resolvedModule && chapter ? curriculumChapterHref(resolvedModule.id, chapter.id) : null,
  }
}

export async function getCurriculumProgressUseCase(context: AuthenticatedContext) {
  const modules = await resolveAllModules()
  const snapshot = await getCurriculumProgressSnapshot(context.supabase, context.userId)
  return {
    modules: modules.map((curriculumModule) => getModuleProgress(curriculumModule, snapshot)),
    resume: getLearningTarget(modules, snapshot),
  }
}

export async function getLearningContinuationUseCase(context: AuthenticatedContext) {
  const modules = await resolveAllModules()
  const [snapshot, dueReviews] = await Promise.all([
    getCurriculumProgressSnapshot(context.supabase, context.userId),
    getDueCount(context.supabase, context.userId),
  ])
  return getLearningContinuation({
    dueReviews,
    resume: getLearningTarget(modules, snapshot),
    completedChapters: modules.flatMap((module) => module.chapters).filter((chapter) => snapshot.completedChapterIds.has(chapter.id)).length,
    totalChapters: modules.flatMap((module) => module.chapters).length,
  })
}

export async function completeCurriculumChapterUseCase(context: AuthenticatedContext, chapterId: string) {
  const resolved = await resolveChapter(chapterId)
  if (!resolved) throw new DomainError('NOT_FOUND', 'Chapter not found')
  const snapshot = await getCurriculumProgressSnapshot(context.supabase, context.userId)
  const summary = getChapterProgress(resolved.chapter, snapshot)
  if (!summary.canComplete && !snapshot.completedChapterIds.has(resolved.chapter.id)) {
    throw new DomainError('CONFLICT', 'Complete the required exercises before finishing this chapter.')
  }
  await recordChapterProgress(context.supabase, context.userId, { chapterId: resolved.chapter.id, moduleId: resolved.module.id, status: 'in_progress' })
  return completeChapter(context.supabase, context.userId, resolved.chapter.id)
}
