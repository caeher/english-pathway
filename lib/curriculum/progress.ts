import type { Chapter, ChapterActivity, Module } from '@/types'
import { isActivityPassed } from '@/lib/curriculum/approval'

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export type ExerciseSequenceState = 'locked' | 'current' | 'passed' | 'needs_retry'

export interface ActivityProgressRecord {
  activity_id: string
  chapter_id: string
  status: ProgressStatus
  passed?: boolean | null
  score?: number | null
  attempts?: number | null
  updated_at?: string
}

export interface CurriculumProgressSnapshot {
  completedChapterIds: ReadonlySet<string>
  activities: readonly ActivityProgressRecord[]
  lastChapterId: string | null
  lastActivityId: string | null
}

export interface ActivityExerciseState {
  activityId: string
  required: boolean
  sequenceState: ExerciseSequenceState
  passed: boolean
  bestScore: number | null
  attempts: number
}

export interface ChapterProgressSummary {
  chapterId: string
  moduleId: string
  status: ProgressStatus
  passedRequiredActivities: number
  totalRequiredActivities: number
  completedActivities: number
  totalActivities: number
  completionPercent: number
  canComplete: boolean
  nextActivityId: string | null
  nextUnlockedActivityId: string | null
  activityStates: ActivityExerciseState[]
}

export interface ModuleProgressSummary {
  moduleId: string
  completedChapters: number
  totalChapters: number
  completionPercent: number
  chapters: ChapterProgressSummary[]
}

export interface LearningTarget {
  moduleId: string
  chapterId: string
  activityId: string | null
}

function getRequiredActivities(chapter: Chapter): ChapterActivity[] {
  return chapter.activities.filter((activity) => activity.required)
}

function buildActivityStates(
  chapter: Chapter,
  progressByActivity: Map<string, ActivityProgressRecord>,
  nextUnlockedActivityId: string | null,
): ActivityExerciseState[] {
  let previousRequiredPassed = true

  return chapter.activities.map((activity) => {
    const record = progressByActivity.get(activity.id)
    const passed = isActivityPassed(activity, record)
    const attempts = record?.attempts ?? 0
    const bestScore = record?.score ?? null

    let sequenceState: ExerciseSequenceState = 'locked'
    if (!activity.required) {
      sequenceState = passed ? 'passed' : attempts > 0 ? 'needs_retry' : 'current'
    } else if (passed) {
      sequenceState = 'passed'
    } else if (activity.id === nextUnlockedActivityId) {
      sequenceState = attempts > 0 ? 'needs_retry' : 'current'
    } else if (previousRequiredPassed) {
      sequenceState = attempts > 0 ? 'needs_retry' : 'current'
    }

    if (activity.required) {
      previousRequiredPassed = passed
    }

    return {
      activityId: activity.id,
      required: activity.required,
      sequenceState,
      passed,
      bestScore,
      attempts,
    }
  })
}

export function getChapterProgress(
  chapter: Chapter,
  snapshot: CurriculumProgressSnapshot,
): ChapterProgressSummary {
  const progressByActivity = new Map(
    snapshot.activities
      .filter((item) => item.chapter_id === chapter.id)
      .map((item) => [item.activity_id, item]),
  )

  const requiredActivities = getRequiredActivities(chapter)
  const passedRequiredActivities = requiredActivities.filter((activity) => (
    isActivityPassed(activity, progressByActivity.get(activity.id))
  )).length
  const totalRequiredActivities = requiredActivities.length

  const nextActivityId = requiredActivities.find(
    (activity) => !isActivityPassed(activity, progressByActivity.get(activity.id)),
  )?.id ?? null

  let nextUnlockedActivityId: string | null = null
  for (const activity of requiredActivities) {
    if (!isActivityPassed(activity, progressByActivity.get(activity.id))) {
      nextUnlockedActivityId = activity.id
      break
    }
  }

  const activityStates = buildActivityStates(chapter, progressByActivity, nextUnlockedActivityId)
  const completed = snapshot.completedChapterIds.has(chapter.id)
  const started = passedRequiredActivities > 0
    || chapter.activities.some((activity) => progressByActivity.has(activity.id))
  const status: ProgressStatus = completed ? 'completed' : started ? 'in_progress' : 'not_started'
  const canComplete = !completed && totalRequiredActivities > 0 && passedRequiredActivities === totalRequiredActivities

  return {
    chapterId: chapter.id,
    moduleId: chapter.moduleId,
    status,
    passedRequiredActivities,
    totalRequiredActivities,
    completedActivities: passedRequiredActivities,
    totalActivities: totalRequiredActivities,
    completionPercent: completed
      ? 100
      : totalRequiredActivities === 0
        ? 0
        : Math.round((passedRequiredActivities / totalRequiredActivities) * 100),
    canComplete,
    nextActivityId,
    nextUnlockedActivityId,
    activityStates,
  }
}

export function getModuleProgress(
  curriculumModule: Module,
  snapshot: CurriculumProgressSnapshot,
): ModuleProgressSummary {
  const chapters = curriculumModule.chapters.map((item) => getChapterProgress(item, snapshot))
  const completedChapters = chapters.filter((item) => item.status === 'completed').length
  return {
    moduleId: curriculumModule.id,
    completedChapters,
    totalChapters: chapters.length,
    completionPercent: chapters.length === 0 ? 0 : Math.round((completedChapters / chapters.length) * 100),
    chapters,
  }
}

export function getCompletableChapterIds(
  chapters: readonly Chapter[],
  snapshot: CurriculumProgressSnapshot,
): string[] {
  return chapters
    .filter((item) => getChapterProgress(item, snapshot).canComplete)
    .map((item) => item.id)
}

export function getLearningTarget(
  modules: readonly Module[],
  snapshot: CurriculumProgressSnapshot,
): LearningTarget | null {
  if (snapshot.lastActivityId) {
    for (const curriculumModule of modules) {
      for (const chapter of curriculumModule.chapters) {
        if (!snapshot.completedChapterIds.has(chapter.id) && chapter.activities.some((activity) => activity.id === snapshot.lastActivityId)) {
          return { moduleId: curriculumModule.id, chapterId: chapter.id, activityId: snapshot.lastActivityId }
        }
      }
    }
  }

  if (snapshot.lastChapterId) {
    for (const curriculumModule of modules) {
      const chapter = curriculumModule.chapters.find((item) => item.id === snapshot.lastChapterId)
      if (chapter && !snapshot.completedChapterIds.has(chapter.id)) {
        const progress = getChapterProgress(chapter, snapshot)
        return {
          moduleId: curriculumModule.id,
          chapterId: chapter.id,
          activityId: progress.nextUnlockedActivityId ?? progress.nextActivityId,
        }
      }
    }
  }

  for (const curriculumModule of modules) {
    for (const chapter of curriculumModule.chapters) {
      const progress = getChapterProgress(chapter, snapshot)
      if (progress.status !== 'completed') {
        return {
          moduleId: curriculumModule.id,
          chapterId: chapter.id,
          activityId: progress.nextUnlockedActivityId ?? progress.nextActivityId,
        }
      }
    }
  }

  return null
}
