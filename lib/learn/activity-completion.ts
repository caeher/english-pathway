import type { ActivityCorrectness, NormalizedActivityResult } from '@/lib/games/result'
import type { FollowUpDecision } from '@/lib/learn/follow-up-planner'
import { shouldApplyNativeActivityUi } from '@/lib/learn/activity-language-policy'

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
  learnerLevel?: string | null
  nativeLanguage?: string | null
}

function followUpPrimaryLabel(followUp: FollowUpDecision, isSpanish = false): string {
  switch (followUp.action) {
    case 'retry':
      return isSpanish ? 'Intentar de nuevo' : 'Try again'
    case 'reinforce':
    case 'variant':
      return isSpanish ? 'Práctica recomendada' : 'Practice recommended'
    case 'advance':
      return isSpanish ? 'Continuar' : 'Continue'
    case 'chapter-complete':
      return isSpanish ? 'Terminar capítulo' : 'Finish chapter'
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
    learnerLevel,
    nativeLanguage,
  } = input
  const weakCount = input.weakItemIndexes.length
  const isSpanish = shouldApplyNativeActivityUi(learnerLevel, nativeLanguage)

  if (followUp) {
    const variant: CompletionVariant = correctness
    const title = correctness === 'complete'
      ? (scorePercent >= 90 ? (isSpanish ? '¡Excelente!' : 'Excellent!') : (isSpanish ? '¡Bien hecho!' : 'Well done!'))
      : correctness === 'partial'
        ? (isSpanish ? '¡Buen progreso!' : 'Good progress!')
        : (isSpanish ? '¡Sigue practicando!' : 'Keep practicing!')
    const subtitle = correctness === 'partial' && weakCount > 0
      ? (isSpanish
          ? `Obtuviste un ${scorePercent}%. ${weakCount} ${weakCount === 1 ? 'elemento necesita' : 'elementos necesitan'} más práctica.`
          : `You scored ${scorePercent}%. ${weakCount} item${weakCount === 1 ? '' : 's'} need more practice.`)
      : (isSpanish
          ? `Obtuviste un ${scorePercent}% en esta actividad.`
          : `You scored ${scorePercent}% on this activity.`)

    return {
      variant,
      title,
      subtitle,
      recommendation: followUp.reason,
      primaryAction: followUpPrimaryAction(followUp),
      primaryLabel: followUpPrimaryLabel(followUp, isSpanish),
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
      title: scorePercent >= 90 ? (isSpanish ? '¡Excelente!' : 'Excellent!') : (isSpanish ? '¡Bien hecho!' : 'Well done!'),
      subtitle: isSpanish ? `Obtuviste un ${scorePercent}% en esta actividad.` : `You scored ${scorePercent}% on this activity.`,
      recommendation: isSpanish ? 'Continúa con la siguiente actividad.' : 'Continue to the next activity.',
      primaryAction: 'continue',
      primaryLabel: isSpanish ? 'Continuar' : 'Continue',
      showRetry: false,
      showReview: hasReviewRefs,
      showContinue: true,
      showTryAlternative: false,
      showContinueAnyway: false,
    }
  }

  if (correctness === 'partial') {
    const weakNote = weakCount > 0
      ? (isSpanish
          ? `${weakCount} ${weakCount === 1 ? 'elemento necesita' : 'elementos necesitan'} más práctica.`
          : `${weakCount} item${weakCount === 1 ? '' : 's'} need more practice.`)
      : (isSpanish ? 'Algunas respuestas pueden mejorar.' : 'Some answers could be stronger.')
    return {
      variant: 'partial',
      title: isSpanish ? '¡Buen progreso!' : 'Good progress!',
      subtitle: isSpanish ? `Obtuviste un ${scorePercent}%. ${weakNote}` : `You scored ${scorePercent}%. ${weakNote}`,
      recommendation: explanations.length > 0
        ? (isSpanish ? 'Revisa las correcciones a continuación y practica los elementos difíciles.' : 'Review the corrections below, then revisit weak items.')
        : (isSpanish ? 'Revisa los elementos difíciles antes de continuar.' : 'Review weak items before moving on.'),
      primaryAction: 'review',
      primaryLabel: isSpanish ? 'Repasar elementos difíciles' : 'Review weak items',
      showRetry: true,
      showReview: hasReviewRefs || nextAction === 'review',
      showContinue: true,
      showTryAlternative: false,
      showContinueAnyway: false,
    }
  }

  return {
    variant: 'needs-practice',
    title: isSpanish ? '¡Sigue practicando!' : 'Keep practicing!',
    subtitle: isSpanish
      ? `Obtuviste un ${scorePercent}%. Concéntrate en los conceptos a continuación.`
      : `You scored ${scorePercent}%. Focus on the missed concepts below.`,
    recommendation: isSpanish ? 'Inténtalo de nuevo para reforzar este tema.' : 'Try again to strengthen this skill.',
    primaryAction: 'retry',
    primaryLabel: isSpanish ? 'Intentar de nuevo' : 'Try again',
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
