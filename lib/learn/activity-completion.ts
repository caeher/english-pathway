import type { ActivityCorrectness, NormalizedActivityResult } from '@/lib/games/result'

export type CompletionVariant = 'complete' | 'partial' | 'needs-practice'

export interface CompletionSummary {
  variant: CompletionVariant
  title: string
  subtitle: string
  recommendation: string
  primaryAction: 'continue' | 'retry' | 'review'
  showRetry: boolean
  showReview: boolean
  showContinue: boolean
}

export interface BuildCompletionSummaryInput extends Omit<NormalizedActivityResult, 'explanations'> {
  explanations?: string[]
  hasReviewRefs?: boolean
}

export function buildCompletionSummary(input: BuildCompletionSummaryInput): CompletionSummary {
  const { correctness, nextAction, scorePercent, explanations = [], hasReviewRefs = false } = input
  const weakCount = input.weakItemIndexes.length

  if (correctness === 'complete') {
    return {
      variant: 'complete',
      title: scorePercent >= 90 ? 'Excellent!' : 'Well done!',
      subtitle: `You scored ${scorePercent}% on this activity.`,
      recommendation: 'Continue to the next activity.',
      primaryAction: 'continue',
      showRetry: false,
      showReview: hasReviewRefs,
      showContinue: true,
    }
  }

  if (correctness === 'partial') {
    const weakNote = weakCount > 0
      ? `${weakCount} item${weakCount === 1 ? '' : 's'} need more practice.`
      : 'Some answers could be stronger.'
    return {
      variant: 'partial',
      title: 'Good progress!',
      subtitle: `You scored ${scorePercent}%. ${weakNote}`,
      recommendation: explanations.length > 0
        ? 'Review the corrections below, then revisit weak items.'
        : 'Review weak items before moving on.',
      primaryAction: 'review',
      showRetry: true,
      showReview: hasReviewRefs || nextAction === 'review',
      showContinue: true,
    }
  }

  return {
    variant: 'needs-practice',
    title: 'Keep practicing!',
    subtitle: `You scored ${scorePercent}%. Focus on the missed concepts below.`,
    recommendation: 'Try again to strengthen this skill.',
    primaryAction: 'retry',
    showRetry: true,
    showReview: hasReviewRefs,
    showContinue: false,
  }
}

export function correctnessFromPercent(scorePercent: number): ActivityCorrectness {
  if (scorePercent === 100) return 'complete'
  if (scorePercent >= 70) return 'partial'
  return 'needs-practice'
}
