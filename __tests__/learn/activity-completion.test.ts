import { describe, expect, it } from 'vitest'
import { buildCompletionSummary } from '@/lib/learn/activity-completion'
import { normalizeActivityResult } from '@/lib/games/result'

describe('buildCompletionSummary', () => {
  it('recommends continue for a complete outcome', () => {
    const normalized = normalizeActivityResult({ score: 4, total: 4 })
    const summary = buildCompletionSummary({ ...normalized, hasReviewRefs: false })

    expect(summary.variant).toBe('complete')
    expect(summary.primaryAction).toBe('continue')
    expect(summary.primaryLabel).toBe('Continue')
    expect(summary.recommendation).toContain('Continue to the next activity')
    expect(summary.showContinue).toBe(true)
    expect(summary.showRetry).toBe(false)
  })

  it('uses follow-up recommendation when provided', () => {
    const normalized = normalizeActivityResult({ score: 3, total: 4, weakItemIndexes: [1] })
    const summary = buildCompletionSummary({
      ...normalized,
      followUp: {
        action: 'reinforce',
        activityId: 'flash-1',
        activityTitle: 'Vocabulary Cards',
        reason: '1 item needs more practice. Practice with "Vocabulary Cards" to reinforce this skill.',
        tutorPayload: {
          action: 'reinforce',
          activityId: 'flash-1',
          scorePercent: 75,
          attempt: 1,
          weakItemCount: 1,
          hintCount: 0,
        },
      },
    })

    expect(summary.primaryAction).toBe('follow-up')
    expect(summary.primaryLabel).toBe('Practice recommended')
    expect(summary.recommendation).toContain('Vocabulary Cards')
    expect(summary.showTryAlternative).toBe(true)
    expect(summary.showContinueAnyway).toBe(true)
  })

  it('recommends review for a partial outcome with weak items', () => {
    const normalized = normalizeActivityResult({
      score: 3,
      total: 4,
      weakItemIndexes: [1],
      explanations: ['The correct answer is "went".'],
    })
    const summary = buildCompletionSummary({
      ...normalized,
      explanations: normalized.explanations,
      hasReviewRefs: true,
    })

    expect(summary.variant).toBe('partial')
    expect(summary.primaryAction).toBe('review')
    expect(summary.showReview).toBe(true)
    expect(summary.showRetry).toBe(true)
    expect(summary.showContinue).toBe(true)
    expect(summary.recommendation).toContain('Review')
  })

  it('recommends retry for needs-practice outcomes', () => {
    const normalized = normalizeActivityResult({ score: 1, total: 4, weakItemIndexes: [0, 2] })
    const summary = buildCompletionSummary({ ...normalized, hasReviewRefs: false })

    expect(summary.variant).toBe('needs-practice')
    expect(summary.primaryAction).toBe('retry')
    expect(summary.recommendation).toContain('Try again')
    expect(summary.showRetry).toBe(true)
    expect(summary.showContinue).toBe(false)
  })
})
