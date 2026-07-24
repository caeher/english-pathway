import type { ActivityCorrectness, NormalizedActivityResult } from '@/lib/games/result'
import type { FollowUpDecision } from '@/lib/learn/follow-up-planner'

export type CompletionVariant = 'complete' | 'partial' | 'needs-practice'

export type CompletionPrimaryAction = 'continue' | 'retry' | 'review' | 'follow-up'

export interface CompletionSummary {
  variant: CompletionVariant
  title: string
  subtitle: string
  recommendation: string
  primaryAction: CompletionPrimaryAction
  primaryLabel: string
  showRetry: boolean
  showReview: boolean
  showContinue: boolean
  showTryAlternative: boolean
  showContinueAnyway: boolean
}

export interface BuildCompletionSummaryInput extends Omit<NormalizedActivityResult, 'explanations'> {
  explanations?: string[]
  hasReviewRefs?: boolean
  followUp?: FollowUpDecision | null
}

function followUpPrimaryLabel(followUp: FollowUpDecision): string {
  switch (followUp.action) {
    case 'retry':
      return 'Try again'
    case 'reinforce':
    case 'variant':
      return 'Practice recommended'
    case 'advance':
      return 'Continue'
    case 'chapter-complete':
      return 'Finish chapter'
  }
}

function followUpPrimaryAction(followUp: FollowUpDecision): CompletionPrimaryAction {
  if (followUp.action === 'retry') return 'retry'
  if (followUp.action === 'chapter-complete') return 'continue'
  if (followUp.action === 'advance') return 'continue'
  return 'follow-up'
}

export function buildCompletionSummary(input: BuildCompletionSummaryInput): CompletionSummary {
  const {
    correctness,
    nextAction,
    scorePercent,
    explanations = [],
    hasReviewRefs = false,
    followUp = null,
  } = input
  const weakCount = input.weakItemIndexes.length

  if (followUp) {
    const variant: CompletionVariant = correctness
    const title = correctness === 'complete'
      ? (scorePercent >= 90 ? 'Excellent!' : 'Well done!')
      : correctness === 'partial'
        ? 'Good progress!'
        : 'Keep practicing!'
    const subtitle = correctness === 'partial' && weakCount > 0
      ? `You scored ${scorePercent}%. ${weakCount} item${weakCount === 1 ? '' : 's'} need more practice.`
      : `You scored ${scorePercent}% on this activity.`

    return {
      variant,
      title,
      subtitle,
      recommendation: followUp.reason,
      primaryAction: followUpPrimaryAction(followUp),
      primaryLabel: followUpPrimaryLabel(followUp),
      showRetry: correctness !== 'complete',
      showReview: hasReviewRefs,
      showContinue: followUp.action !== 'advance' && followUp.action !== 'chapter-complete',
      showTryAlternative: followUp.action === 'reinforce' || followUp.action === 'variant' || followUp.action === 'retry',
      showContinueAnyway: followUp.action === 'reinforce' || followUp.action === 'variant',
    }
  }

  if (correctness === 'complete') {
    return {
      variant: 'complete',
      title: scorePercent >= 90 ? 'Excellent!' : 'Well done!',
      subtitle: `You scored ${scorePercent}% on this activity.`,
      recommendation: 'Continue to the next activity.',
      primaryAction: 'continue',
      primaryLabel: 'Continue',
      showRetry: false,
      showReview: hasReviewRefs,
      showContinue: true,
      showTryAlternative: false,
      showContinueAnyway: false,
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
      primaryLabel: 'Review weak items',
      showRetry: true,
      showReview: hasReviewRefs || nextAction === 'review',
      showContinue: true,
      showTryAlternative: false,
      showContinueAnyway: false,
    }
  }

  return {
    variant: 'needs-practice',
    title: 'Keep practicing!',
    subtitle: `You scored ${scorePercent}%. Focus on the missed concepts below.`,
    recommendation: 'Try again to strengthen this skill.',
    primaryAction: 'retry',
    primaryLabel: 'Try again',
    showRetry: true,
    showReview: hasReviewRefs,
    showContinue: false,
    showTryAlternative: false,
    showContinueAnyway: false,
  }
}

export function correctnessFromPercent(scorePercent: number): ActivityCorrectness {
  if (scorePercent === 100) return 'complete'
  if (scorePercent >= 70) return 'partial'
  return 'needs-practice'
}
