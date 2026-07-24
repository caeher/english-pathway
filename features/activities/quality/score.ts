import type { ActivityValidationIssue } from '../validation'
import {
  type QualityFinding,
  type RubricDimension,
  RUBRIC_DIMENSION_WEIGHTS,
  RUBRIC_DIMENSIONS,
} from './rubric'

function mapValidationIssueToFinding(issue: ActivityValidationIssue): QualityFinding {
  const severity = issue.severity === 'error' ? 'blocking' : 'advisory'
  const field = issue.field.toLowerCase()

  let dimension: RubricDimension = 'learnerResponse'
  if (field.includes('title') || field.includes('description') || field === 'id') {
    dimension = 'observableObjective'
  } else if (field.includes('alttext') || field.includes('audio')) {
    dimension = 'accessibility'
  } else if (field.includes('explanation') || field.includes('hint') || field.includes('feedback')) {
    dimension = 'feedback'
  } else if (field.includes('question') || field.includes('item') || field.includes('props')) {
    dimension = 'comprehensibleInput'
  } else if (field.includes('contrast') || field.includes('node') || field.includes('choice')) {
    dimension = 'masteryEvidence'
  }

  return {
    dimension,
    severity,
    field: issue.field,
    message: issue.message,
    activityId: issue.activityId,
  }
}

export interface ActivityQualityScore {
  activityId: string
  score: number
  findings: QualityFinding[]
  weakDimensions: RubricDimension[]
}

export interface ChapterQualityScore {
  moduleId: string
  chapterId: string
  score: number
  activityScores: ActivityQualityScore[]
  chapterFindings: QualityFinding[]
  weakDimensions: RubricDimension[]
}

function dimensionPenalty(findings: QualityFinding[], dimension: RubricDimension): number {
  const relevant = findings.filter((finding) => finding.dimension === dimension)
  if (relevant.length === 0) return 0

  const blocking = relevant.filter((finding) => finding.severity === 'blocking').length
  const advisory = relevant.filter((finding) => finding.severity === 'advisory').length
  const penalty = Math.min(1, (blocking * 0.5) + (advisory * 0.15))
  return penalty
}

export function scoreFromFindings(findings: QualityFinding[]): number {
  if (findings.length === 0) return 100

  let earned = 0
  let totalWeight = 0

  for (const dimension of RUBRIC_DIMENSIONS) {
    const weight = RUBRIC_DIMENSION_WEIGHTS[dimension]
    totalWeight += weight
    const penalty = dimensionPenalty(findings, dimension)
    earned += weight * (1 - penalty)
  }

  return Math.max(0, Math.round((earned / totalWeight) * 100))
}

export function weakDimensionsFromFindings(findings: QualityFinding[]): RubricDimension[] {
  return RUBRIC_DIMENSIONS.filter((dimension) => dimensionPenalty(findings, dimension) >= 0.3)
}

export function scoreActivityQuality(input: {
  activityId: string
  validationIssues: ActivityValidationIssue[]
  editorialFindings: QualityFinding[]
}): ActivityQualityScore {
  const findings = [
    ...input.validationIssues
      .filter((issue) => issue.activityId === input.activityId)
      .map(mapValidationIssueToFinding),
    ...input.editorialFindings.filter((finding) => finding.activityId === input.activityId),
  ]

  return {
    activityId: input.activityId,
    score: scoreFromFindings(findings),
    findings,
    weakDimensions: weakDimensionsFromFindings(findings),
  }
}

export function scoreChapterQuality(input: {
  moduleId: string
  chapterId: string
  activityIds: string[]
  validationIssues: ActivityValidationIssue[]
  editorialFindings: QualityFinding[]
  chapterFindings: QualityFinding[]
}): ChapterQualityScore {
  const activityScores = input.activityIds.map((activityId) => scoreActivityQuality({
    activityId,
    validationIssues: input.validationIssues,
    editorialFindings: input.editorialFindings,
  }))

  const combinedFindings = [
    ...input.chapterFindings,
    ...activityScores.flatMap((score) => score.findings),
  ]

  const averageActivityScore = activityScores.length > 0
    ? Math.round(activityScores.reduce((sum, score) => sum + score.score, 0) / activityScores.length)
    : 100
  const chapterPenalty = Math.min(20, input.chapterFindings.filter((finding) => finding.severity === 'blocking').length * 10)
  const score = Math.max(0, Math.round((averageActivityScore * 0.85) + (scoreFromFindings(combinedFindings) * 0.15) - chapterPenalty))

  return {
    moduleId: input.moduleId,
    chapterId: input.chapterId,
    score,
    activityScores,
    chapterFindings: input.chapterFindings,
    weakDimensions: weakDimensionsFromFindings(combinedFindings),
  }
}
