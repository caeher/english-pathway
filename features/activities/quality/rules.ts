import type { ChapterActivityInput } from '../contracts'
import { activityRegistry } from '../registry'
import type { QualityFinding } from './rubric'

export const RETIRED_ACTIVITY_TYPES = ['svg-scene'] as const

export const GENERIC_TITLES = new Set([
  'listen and choose',
  'listening practice',
  'dictation practice',
  'pronunciation practice',
  'word match',
  'word scramble',
  'sentence builder',
  'quiz',
  'flashcards',
  'practice',
])

export const GENERIC_DESCRIPTIONS = new Set([
  'listen and choose the correct answer.',
  'match the words with their meanings.',
  'unscramble the letters to form words.',
  'build sentences from the words.',
  'test your knowledge with this quiz.',
  'practice pronunciation of key phrases.',
  'listen and type what you hear.',
  'review key vocabulary with flashcards.',
])

const MIN_ITEM_COUNTS: Partial<Record<ChapterActivityInput['type'], number>> = {
  quiz: 5,
  listening: 3,
  dictation: 3,
  pronunciation: 3,
  'sentence-builder': 3,
  'minimal-pairs': 2,
}

const DUPLICATE_ACTIVITY_TYPES = new Set(['flashcard', 'word-match', 'word-scramble'])

export interface ModuleCoverageRule {
  listening?: { minChapters: number; totalChapters: number }
  pronunciation?: { minChapters: number; totalChapters: number }
  dictation?: { minChapters: number; totalChapters: number }
  'sentence-builder'?: { minChapters: number; totalChapters: number }
  allChapters?: Array<'listening' | 'pronunciation' | 'dictation' | 'sentence-builder'>
}

export const MODULE_COVERAGE_RULES: Record<string, ModuleCoverageRule> = {
  'modulo-1': { allChapters: ['listening', 'pronunciation', 'dictation'] },
  'modulo-2': { listening: { minChapters: 4, totalChapters: 6 }, 'sentence-builder': { minChapters: 4, totalChapters: 6 } },
  'modulo-3': { listening: { minChapters: 4, totalChapters: 6 }, 'sentence-builder': { minChapters: 4, totalChapters: 6 } },
  'modulo-4': { listening: { minChapters: 4, totalChapters: 6 }, 'sentence-builder': { minChapters: 4, totalChapters: 6 } },
  'modulo-5': { listening: { minChapters: 4, totalChapters: 6 }, 'sentence-builder': { minChapters: 4, totalChapters: 6 } },
  'modulo-6': { listening: { minChapters: 4, totalChapters: 6 }, 'sentence-builder': { minChapters: 4, totalChapters: 6 } },
  'modulo-7': { listening: { minChapters: 4, totalChapters: 6 }, 'sentence-builder': { minChapters: 4, totalChapters: 6 } },
  'modulo-8': { allChapters: ['listening', 'pronunciation', 'dictation', 'sentence-builder'] },
  'modulo-9': { allChapters: ['listening', 'pronunciation'], dictation: { minChapters: 2, totalChapters: 5 } },
  'modulo-10': { 'sentence-builder': { minChapters: 2, totalChapters: 5 } },
  'modulo-11': { allChapters: ['sentence-builder'] },
  'modulo-12': { allChapters: ['listening', 'pronunciation'] },
  'modulo-13': { listening: { minChapters: 4, totalChapters: 5 }, pronunciation: { minChapters: 4, totalChapters: 5 } },
  'modulo-14': { listening: { minChapters: 3, totalChapters: 5 }, pronunciation: { minChapters: 3, totalChapters: 5 } },
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isGenericTitle(title: string): boolean {
  return GENERIC_TITLES.has(normalizeText(title))
}

export function isGenericDescription(description: string): boolean {
  return GENERIC_DESCRIPTIONS.has(normalizeText(description))
}

export function extractComparableContent(activity: ChapterActivityInput): string[] {
  switch (activity.type) {
    case 'flashcard':
      return activity.props.cards.flatMap((card) => [card.front, card.back])
    case 'word-match':
      return activity.props.pairs.flatMap((pair) => [pair.left, pair.right])
    case 'word-scramble':
      return activity.props.words.map((entry) => entry.word)
    default:
      return []
  }
}

function countItems(activity: ChapterActivityInput): number {
  switch (activity.type) {
    case 'quiz':
      return activity.props.questions.length
    case 'flashcard':
      return activity.props.cards.length
    case 'word-match':
      return activity.props.pairs.length
    case 'sentence-builder':
      return activity.props.sentences.length
    case 'word-scramble':
      return activity.props.words.length
    case 'listening':
    case 'dictation':
      return activity.props.items.length
    case 'pronunciation':
      return activity.props.items.length
    case 'minimal-pairs':
      return activity.props.pairs.length
    case 'branching-dialogue':
      return activity.props.nodes.length
    default:
      return 0
  }
}

function hasItemFeedback(type: ChapterActivityInput['type']): boolean {
  return activityRegistry[type].capabilities.supports.has('itemFeedback')
}

function hasScoring(type: ChapterActivityInput['type']): boolean {
  return activityRegistry[type].behavior.result
}

export function evaluateActivityEditorialRules(
  chapterId: string,
  activity: ChapterActivityInput,
): QualityFinding[] {
  const findings: QualityFinding[] = []
  const expectedId = `${chapterId}-${activity.type}`

  if (activity.id !== expectedId && !activity.id.startsWith(`${chapterId}-`)) {
    findings.push({
      dimension: 'observableObjective',
      severity: 'advisory',
      field: 'id',
      message: `activity id "${activity.id}" should follow ${chapterId}-{type}`,
      activityId: activity.id,
    })
  }

  if (isGenericTitle(activity.title)) {
    findings.push({
      dimension: 'observableObjective',
      severity: 'advisory',
      field: 'title',
      message: 'title looks like a generic template instead of a chapter-specific objective',
      activityId: activity.id,
    })
  }

  if (isGenericDescription(activity.description)) {
    findings.push({
      dimension: 'observableObjective',
      severity: 'advisory',
      field: 'description',
      message: 'description looks like a generic template',
      activityId: activity.id,
    })
  }

  const minCount = MIN_ITEM_COUNTS[activity.type]
  const itemCount = countItems(activity)
  if (minCount && itemCount < minCount) {
    findings.push({
      dimension: 'difficulty',
      severity: 'advisory',
      field: 'props',
      message: `${activity.type} should include at least ${minCount} items (found ${itemCount})`,
      activityId: activity.id,
    })
  }

  if (!hasItemFeedback(activity.type) && activity.type !== 'flashcard') {
    findings.push({
      dimension: 'learnerResponse',
      severity: 'advisory',
      field: 'type',
      message: `${activity.type} does not expose per-item answer feedback`,
      activityId: activity.id,
    })
  }

  if (!hasScoring(activity.type)) {
    findings.push({
      dimension: 'masteryEvidence',
      severity: 'blocking',
      field: 'type',
      message: `${activity.type} does not produce a scored result`,
      activityId: activity.id,
    })
  }

  if (activity.type === 'listening' || activity.type === 'dictation') {
    const items = activity.props.items
    const genericAudio = items.filter((item) => /^(hello|goodbye|thank you)$/i.test(item.audioText.trim()))
    if (genericAudio.length > 0) {
      findings.push({
        dimension: 'comprehensibleInput',
        severity: 'advisory',
        field: 'props.items',
        message: 'listening/dictation includes generic filler phrases',
        activityId: activity.id,
      })
    }
  }

  if (activity.type === 'quiz') {
    const missingExplanations = activity.props.questions.filter((question) => !question.explanation?.trim()).length
    if (missingExplanations > 0) {
      findings.push({
        dimension: 'feedback',
        severity: 'advisory',
        field: 'props.questions',
        message: `${missingExplanations} quiz question(s) lack explanations`,
        activityId: activity.id,
      })
    }
  }

  if (activity.type === 'listening') {
    const missingAlt = activity.props.items.filter((item) => item.audio && !item.audio.altText?.trim()).length
    if (missingAlt > 0) {
      findings.push({
        dimension: 'accessibility',
        severity: 'advisory',
        field: 'props.items',
        message: `${missingAlt} curated listening item(s) lack audio altText`,
        activityId: activity.id,
      })
    }
  }

  return findings
}

export function findDuplicateContentAcrossChapter(activities: ChapterActivityInput[]): QualityFinding[] {
  const findings: QualityFinding[] = []
  const seen = new Map<string, { activityId: string; type: string }>()

  for (const activity of activities) {
    if (!DUPLICATE_ACTIVITY_TYPES.has(activity.type)) continue

    for (const text of extractComparableContent(activity)) {
      const key = normalizeText(text)
      if (!key) continue

      const previous = seen.get(key)
      if (previous && previous.activityId !== activity.id) {
        findings.push({
          dimension: 'comprehensibleInput',
          severity: 'advisory',
          field: 'props',
          message: `duplicate content "${text}" also appears in ${previous.activityId} (${previous.type})`,
          activityId: activity.id,
        })
      } else if (!previous) {
        seen.set(key, { activityId: activity.id, type: activity.type })
      }
    }
  }

  return findings
}

export function evaluateChapterBundleRules(
  chapterId: string,
  activities: ChapterActivityInput[],
): QualityFinding[] {
  const findings: QualityFinding[] = []
  const count = activities.length

  if (count < 6 || count > 8) {
    findings.push({
      dimension: 'difficulty',
      severity: 'advisory',
      field: 'chapter',
      message: `chapter ${chapterId} should include 6–8 activities (found ${count})`,
    })
  }

  findings.push(...findDuplicateContentAcrossChapter(activities))
  return findings
}

export function evaluateModuleCoverage(
  moduleId: string,
  chapters: Array<{ chapterId: string; activities: ChapterActivityInput[] }>,
): QualityFinding[] {
  const rule = MODULE_COVERAGE_RULES[moduleId]
  if (!rule) return []

  const findings: QualityFinding[] = []
  const typesByChapter = chapters.map((chapter) => ({
    chapterId: chapter.chapterId,
    types: new Set(chapter.activities.map((activity) => activity.type)),
  }))

  if (rule.allChapters) {
    for (const chapter of typesByChapter) {
      for (const requiredType of rule.allChapters) {
        if (!chapter.types.has(requiredType)) {
          findings.push({
            dimension: 'difficulty',
            severity: 'advisory',
            field: 'chapter',
            message: `${moduleId}/${chapter.chapterId} is missing required type ${requiredType}`,
          })
        }
      }
    }
  }

  for (const [type, coverage] of Object.entries(rule)) {
    if (type === 'allChapters' || !coverage || typeof coverage !== 'object') continue
    const typedCoverage = coverage as { minChapters: number; totalChapters: number }
    const chaptersWithType = typesByChapter.filter((chapter) => chapter.types.has(type as ChapterActivityInput['type'])).length
    if (chaptersWithType < typedCoverage.minChapters) {
      findings.push({
        dimension: 'difficulty',
        severity: 'advisory',
        field: 'module',
        message: `${moduleId} should include ${type} in at least ${typedCoverage.minChapters}/${typedCoverage.totalChapters} chapters (found ${chaptersWithType})`,
      })
    }
  }

  return findings
}
