export const RUBRIC_DIMENSIONS = [
  'observableObjective',
  'comprehensibleInput',
  'learnerResponse',
  'feedback',
  'difficulty',
  'accessibility',
  'masteryEvidence',
] as const

export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number]

export type FindingSeverity = 'blocking' | 'advisory'

export interface QualityFinding {
  dimension: RubricDimension
  severity: FindingSeverity
  field: string
  message: string
  activityId?: string
}

export const RUBRIC_DIMENSION_WEIGHTS: Record<RubricDimension, number> = {
  observableObjective: 15,
  comprehensibleInput: 15,
  learnerResponse: 10,
  feedback: 20,
  difficulty: 15,
  accessibility: 10,
  masteryEvidence: 15,
}

export function dimensionLabel(dimension: RubricDimension): string {
  const labels: Record<RubricDimension, string> = {
    observableObjective: 'Observable objective',
    comprehensibleInput: 'Comprehensible input',
    learnerResponse: 'Learner response',
    feedback: 'Feedback',
    difficulty: 'Difficulty',
    accessibility: 'Accessibility',
    masteryEvidence: 'Mastery evidence',
  }
  return labels[dimension]
}
