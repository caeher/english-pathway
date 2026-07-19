export type ActivityCorrectness = 'complete' | 'partial' | 'needs-practice'

export interface NormalizedActivityResult {
  score: number
  total: number
  scorePercent: number
  correctness: ActivityCorrectness
  explanations: string[]
  nextAction: 'continue' | 'retry' | 'review'
  metrics: Record<string, number>
  weakItemIndexes: number[]
}

export function normalizeActivityResult(input: {
  score: number
  total: number
  scorePercent?: number
  explanations?: string[]
  weakItemIndexes?: number[]
  metrics?: Record<string, number>
}): NormalizedActivityResult {
  const scorePercent = input.scorePercent ?? Math.round((input.score / input.total) * 100)
  const correctness: ActivityCorrectness = scorePercent === 100 ? 'complete' : scorePercent >= 70 ? 'partial' : 'needs-practice'
  return {
    score: input.score, total: input.total, scorePercent, correctness,
    explanations: input.explanations ?? [],
    nextAction: correctness === 'needs-practice' ? 'retry' : correctness === 'partial' ? 'review' : 'continue',
    metrics: input.metrics ?? {}, weakItemIndexes: input.weakItemIndexes ?? [],
  }
}
