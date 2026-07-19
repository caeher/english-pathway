import { chapterActivitySchema } from './contracts'

export interface ActivityValidationIssue {
  moduleId: string
  chapterId: string
  activityId: string
  field: string
  message: string
}

export function validateActivityDocument(moduleId: string, chapterId: string, activity: unknown, index: number): ActivityValidationIssue[] {
  const parsed = chapterActivitySchema.safeParse(activity)
  if (parsed.success) return []
  const raw = activity && typeof activity === 'object' ? activity as Record<string, unknown> : {}
  const activityId = typeof raw.id === 'string' ? raw.id : `index:${index}`
  return parsed.error.issues.map((issue) => ({
    moduleId,
    chapterId,
    activityId,
    field: issue.path.length > 0 ? issue.path.join('.') : 'activity',
    message: issue.message,
  }))
}

export function validateActivityList(moduleId: string, chapterId: string, activities: unknown[]): ActivityValidationIssue[] {
  return activities.flatMap((activity, index) => validateActivityDocument(moduleId, chapterId, activity, index))
}
