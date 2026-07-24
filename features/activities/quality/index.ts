import type { ChapterActivityInput } from '../contracts'
import { chapterActivitySchema } from '../contracts'
import { validateActivityList, type ActivityValidationIssue } from '../validation'
import {
  evaluateActivityEditorialRules,
  evaluateChapterBundleRules,
  evaluateModuleCoverage,
} from './rules'
import { scoreChapterQuality, type ChapterQualityScore } from './score'

export * from './rubric'
export * from './rules'
export * from './score'

export interface ChapterQualityInput {
  moduleId: string
  chapterId: string
  activities: unknown[]
}

function parseActivities(activities: unknown[]): ChapterActivityInput[] {
  return activities.flatMap((activity) => {
    const parsed = chapterActivitySchema.safeParse(activity)
    return parsed.success ? [parsed.data] : []
  })
}

export function evaluateChapterQuality(input: ChapterQualityInput): {
  validationIssues: ActivityValidationIssue[]
  chapterScore: ChapterQualityScore
} {
  const validationIssues = validateActivityList(input.moduleId, input.chapterId, input.activities)
  const parsedActivities = parseActivities(input.activities)
  const editorialFindings = parsedActivities.flatMap((activity) => evaluateActivityEditorialRules(input.chapterId, activity))
  const chapterFindings = evaluateChapterBundleRules(input.chapterId, parsedActivities)

  const chapterScore = scoreChapterQuality({
    moduleId: input.moduleId,
    chapterId: input.chapterId,
    activityIds: parsedActivities.map((activity) => activity.id),
    validationIssues,
    editorialFindings,
    chapterFindings,
  })

  return { validationIssues, chapterScore }
}

export function evaluateModuleQuality(chapters: ChapterQualityInput[]): {
  moduleFindings: ReturnType<typeof evaluateModuleCoverage>
  chapters: Array<ReturnType<typeof evaluateChapterQuality>>
} {
  const chaptersReport = chapters.map((chapter) => evaluateChapterQuality(chapter))
  const parsedByChapter = chapters.map((chapter) => ({
    chapterId: chapter.chapterId,
    activities: parseActivities(chapter.activities),
  }))
  const moduleId = chapters[0]?.moduleId ?? 'unknown-module'
  const moduleFindings = evaluateModuleCoverage(moduleId, parsedByChapter)

  return {
    moduleFindings,
    chapters: chaptersReport,
  }
}
