import type { Chapter, Module } from '@/types'

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface ActivityProgressRecord {
  activity_id: string
  chapter_id: string
  status: ProgressStatus
  score?: number | null
  updated_at?: string
}

export interface CurriculumProgressSnapshot {
  completedChapterIds: ReadonlySet<string>
  activities: readonly ActivityProgressRecord[]
  lastChapterId: string | null
  lastActivityId: string | null
}

export interface ChapterProgressSummary {
  chapterId: string
  moduleId: string
  status: ProgressStatus
  completedActivities: number
  totalActivities: number
  completionPercent: number
  canComplete: boolean
  nextActivityId: string | null
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

export function getChapterProgress(
  chapter: Chapter,
  snapshot: CurriculumProgressSnapshot,
): ChapterProgressSummary {
  const progressByActivity = new Map(
    snapshot.activities
      .filter((item) => item.chapter_id === chapter.id)
      .map((item) => [item.activity_id, item]),
  )
  const completedActivities = chapter.activities.filter(
    (activity) => progressByActivity.get(activity.id)?.status === 'completed',
  ).length
  const canComplete = chapter.activities.length === 0 || completedActivities === chapter.activities.length
  const completed = snapshot.completedChapterIds.has(chapter.id)
  const started = completedActivities > 0 || chapter.activities.some((activity) => progressByActivity.has(activity.id))
  const status: ProgressStatus = completed ? 'completed' : started ? 'in_progress' : 'not_started'
  const totalActivities = chapter.activities.length

  return {
    chapterId: chapter.id,
    moduleId: chapter.moduleId,
    status,
    completedActivities,
    totalActivities,
    completionPercent: completed
      ? 100
      : totalActivities === 0
        ? 0
        : Math.round((completedActivities / totalActivities) * 100),
    canComplete: !completed && canComplete,
    nextActivityId: chapter.activities.find(
      (activity) => progressByActivity.get(activity.id)?.status !== 'completed',
    )?.id ?? null,
  }
}

export function getModuleProgress(
  curriculumModule: Module,
  snapshot: CurriculumProgressSnapshot,
): ModuleProgressSummary {
  const chapters = curriculumModule.chapters.map((chapter) => getChapterProgress(chapter, snapshot))
  const completedChapters = chapters.filter((chapter) => chapter.status === 'completed').length
  return {
    moduleId: curriculumModule.id,
    completedChapters,
    totalChapters: chapters.length,
    completionPercent: chapters.length === 0 ? 0 : Math.round((completedChapters / chapters.length) * 100),
    chapters,
  }
}

export function getLearningTarget(
  modules: readonly Module[],
  snapshot: CurriculumProgressSnapshot,
): LearningTarget | null {
  if (snapshot.lastActivityId) {
    for (const curriculumModule of modules) {
      for (const chapter of curriculumModule.chapters) {
        if (chapter.activities.some((activity) => activity.id === snapshot.lastActivityId)) {
          return { moduleId: curriculumModule.id, chapterId: chapter.id, activityId: snapshot.lastActivityId }
        }
      }
    }
  }

  if (snapshot.lastChapterId) {
    for (const curriculumModule of modules) {
      const chapter = curriculumModule.chapters.find((item) => item.id === snapshot.lastChapterId)
      if (chapter) {
        return {
          moduleId: curriculumModule.id,
          chapterId: chapter.id,
          activityId: chapter.activities[0]?.id ?? null,
        }
      }
    }
  }

  for (const curriculumModule of modules) {
    for (const chapter of curriculumModule.chapters) {
      const progress = getChapterProgress(chapter, snapshot)
      if (progress.status !== 'completed') {
        return { moduleId: curriculumModule.id, chapterId: chapter.id, activityId: progress.nextActivityId }
      }
    }
  }

  return null
}
