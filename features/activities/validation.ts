import { chapterActivitySchema } from './contracts'

export interface ActivityValidationIssue {
  moduleId: string
  chapterId: string
  activityId: string
  field: string
  message: string
  severity?: 'error' | 'warning'
}

function validateQuizSemantics(
  moduleId: string,
  chapterId: string,
  activityId: string,
  props: { questions: Array<{ id: string; type: string; options?: string[]; correct?: number | string; explanation?: string }> },
): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []

  for (const [index, question] of props.questions.entries()) {
    if (question.type !== 'multiple-choice' || !question.options) continue

    const correctIndex = question.correct as number
    const correctOption = question.options[correctIndex]
    const distractors = question.options.filter((_, i) => i !== correctIndex)
    const distinctDistractors = new Set(distractors.map((o) => o.trim().toLowerCase()))

    if (distinctDistractors.size < 2) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.questions.${index}.options`,
        message: 'multiple-choice questions should have at least two distinct distractors',
        severity: 'warning',
      })
    }

    if (!question.explanation?.trim()) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.questions.${index}.explanation`,
        message: 'multiple-choice questions should include an explanation for feedback',
        severity: 'warning',
      })
    }

    if (correctOption && distractors.some((d) => d.trim().toLowerCase() === correctOption.trim().toLowerCase())) {
      issues.push({
        moduleId,
        chapterId,
        activityId,
        field: `props.questions.${index}.options`,
        message: 'a distractor matches the correct answer',
        severity: 'error',
      })
    }
  }

  return issues
}

export function validateActivityDocument(moduleId: string, chapterId: string, activity: unknown, index: number): ActivityValidationIssue[] {
  const parsed = chapterActivitySchema.safeParse(activity)
  const raw = activity && typeof activity === 'object' ? activity as Record<string, unknown> : {}
  const activityId = typeof raw.id === 'string' ? raw.id : `index:${index}`

  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      moduleId,
      chapterId,
      activityId,
      field: issue.path.length > 0 ? issue.path.join('.') : 'activity',
      message: issue.message,
      severity: 'error' as const,
    }))
  }

  if (parsed.data.type === 'quiz') {
    return validateQuizSemantics(moduleId, chapterId, activityId, parsed.data.props)
  }

  return []
}

export function validateActivityList(moduleId: string, chapterId: string, activities: unknown[]): ActivityValidationIssue[] {
  return activities.flatMap((activity, index) => validateActivityDocument(moduleId, chapterId, activity, index))
}

export function filterValidationErrors(issues: ActivityValidationIssue[]): ActivityValidationIssue[] {
  return issues.filter((issue) => issue.severity !== 'warning')
}
