import { DomainError } from '@/lib/api/errors'
import type { AuthenticatedContext } from '@/lib/api/context'
import type { ActivityProgressInput, ChapterProgressInput, MergeProgressInput } from './contracts'
import { resolveActivityByIdValidated } from '@/features/learn'
import { curriculumChapterHref, getChapterProgress, getLearningTarget, getModuleProgress, learnHref, resolveAllModules, resolveChapter } from '@/features/curriculum'
import {
  completeChapter,
  getCurriculumProgressSnapshot,
  getLastProgress,
  mergeLearningProgress,
  recordActivityProgress,
  recordChapterProgress,
} from './server'
import { getDueCount } from '@/lib/dal/srs'
import { getLearningContinuation } from '@/lib/learning/continuation'

export async function saveActivityProgressUseCase(context: AuthenticatedContext, input: ActivityProgressInput) {
  const resolved = resolveActivityByIdValidated(input.activityId)
  if (!resolved || (input.chapterId && input.chapterId !== resolved.chapter.id)) {
    throw new DomainError('NOT_FOUND', 'Activity not found')
  }
  return recordActivityProgress(context.supabase, context.userId, {
    ...input,
    chapterId: resolved.chapter.id,
    moduleId: resolved.module.id,
    activityType: resolved.activity.type,
  })
}

export async function saveChapterProgressUseCase(context: AuthenticatedContext, input: ChapterProgressInput) {
  const resolved = await resolveChapter(input.chapterId)
  if (!resolved || (input.moduleId && input.moduleId !== resolved.module.id)) {
    throw new DomainError('NOT_FOUND', 'Chapter not found')
  }

  if (input.status === 'completed') {
    const snapshot = await getCurriculumProgressSnapshot(context.supabase, context.userId)
    const summary = getChapterProgress(resolved.chapter, snapshot)
    if (!summary.canComplete && !snapshot.completedChapterIds.has(resolved.chapter.id)) {
      throw new DomainError('CONFLICT', 'Complete the chapter activities before finishing this chapter.')
    }
  }

  const progress = await recordChapterProgress(context.supabase, context.userId, {
    ...input,
    moduleId: resolved.module.id,
  })
  if (input.status === 'completed') await completeChapter(context.supabase, context.userId, resolved.chapter.id)
  return progress
}

async function resolveMergeInput(input: MergeProgressInput) {
  const activities = []
  for (const activity of input.activities) {
    const resolved = resolveActivityByIdValidated(activity.activityId)
    if (!resolved || (activity.chapterId && activity.chapterId !== resolved.chapter.id)) {
      throw new DomainError('INVALID_INPUT', `Activity not found: ${activity.activityId}`)
    }
    activities.push({
      ...activity,
      chapterId: resolved.chapter.id,
      moduleId: resolved.module.id,
      activityType: resolved.activity.type,
    })
  }

  const chapters = []
  for (const chapter of input.chapters) {
    const resolved = await resolveChapter(chapter.chapterId)
    if (!resolved || (chapter.moduleId && chapter.moduleId !== resolved.module.id)) {
      throw new DomainError('INVALID_INPUT', `Chapter not found: ${chapter.chapterId}`)
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
  const existing = await getCurriculumProgressSnapshot(context.supabase, context.userId)

  for (const chapter of chapters.filter((item) => item.status === 'completed')) {
    const resolved = await resolveChapter(chapter.chapterId)
    if (!resolved) continue
    const candidateActivities = [
      ...existing.activities,
      ...activities.filter((item) => item.chapterId === resolved.chapter.id).map((item) => ({
        activity_id: item.activityId,
        chapter_id: item.chapterId,
        status: item.status,
        score: item.score,
      })),
    ]
    const summary = getChapterProgress(resolved.chapter, { ...existing, activities: candidateActivities })
    if (!summary.canComplete && !existing.completedChapterIds.has(resolved.chapter.id)) {
      throw new DomainError('CONFLICT', `Complete the chapter activities before finishing: ${resolved.chapter.id}`)
    }
  }

  const result = await mergeLearningProgress(context.supabase, context.userId, activities, chapters, lastActivity)
  for (const chapter of chapters.filter((item) => item.status === 'completed')) {
    await completeChapter(context.supabase, context.userId, chapter.chapterId)
  }
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
    learnUrl: resolvedModule && chapter ? learnHref({
      moduleId: resolvedModule.id,
      chapterId: chapter.id,
      activityId: resolvedActivity?.activity.id ?? null,
    }) : null,
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
    throw new DomainError('CONFLICT', 'Complete the chapter activities before finishing this chapter.')
  }
  await recordChapterProgress(context.supabase, context.userId, { chapterId: resolved.chapter.id, moduleId: resolved.module.id, status: 'completed' })
  return completeChapter(context.supabase, context.userId, resolved.chapter.id)
}
