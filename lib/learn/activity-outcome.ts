import type { ActivityCorrectness } from '@/lib/games/result'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'

export type ActivityOutcomeStatus = 'completed' | 'skipped' | 'closed' | 'abandoned'

export interface ActivityOutcome {
  activityId: string
  activityType: string
  status: ActivityOutcomeStatus
  score?: number
  total?: number
  scorePercent?: number
  correctness?: ActivityCorrectness
  attempts: number
  hintsUsed: number
  weakItemIndexes?: number[]
  timeSpentSeconds?: number
  chapterId?: string
  moduleId?: string
  reason?: string
}

export function formatActivityOutcomeMessage(outcome: ActivityOutcome): string {
  const { activityId, activityType, status, scorePercent, score, total, correctness, attempts, hintsUsed, weakItemIndexes, reason } = outcome

  if (status === 'completed') {
    const scoreStr = typeof scorePercent === 'number'
      ? `${scorePercent}%`
      : typeof score === 'number' && typeof total === 'number' && total > 0
        ? `${Math.round((score / total) * 100)}%`
        : 'completed'

    const correctnessStr = correctness ? ` Result: ${correctness}.` : ''
    const attemptsStr = attempts > 1 ? ` Attempts: ${attempts}.` : ''
    const hintsStr = hintsUsed > 0 ? ` Hints used: ${hintsUsed}.` : ''
    const weakStr = weakItemIndexes && weakItemIndexes.length > 0
      ? ` Weak items: ${weakItemIndexes.length}.`
      : ''

    return `I completed activity ${activityId} (${activityType}) with score ${scoreStr}.${correctnessStr}${attemptsStr}${hintsStr}${weakStr}`
  }

  if (status === 'skipped') {
    const attemptsStr = attempts > 0 ? ` Attempts: ${attempts}.` : ''
    const hintsStr = hintsUsed > 0 ? ` Hints used: ${hintsUsed}.` : ''
    const reasonStr = reason ? ` Reason: ${reason}.` : ''
    return `I skipped activity ${activityId} (${activityType}) without finishing.${attemptsStr}${hintsStr}${reasonStr} Please offer an alternative exercise or review the concept.`
  }

  // status === 'closed' || status === 'abandoned'
  const attemptsStr = attempts > 0 ? ` Attempts: ${attempts}.` : ''
  return `I closed activity ${activityId} (${activityType}) before finishing.${attemptsStr}`
}

export function toActivityOutcomeFromCompleteResult(
  result: ActivityCompleteResult,
  meta?: { attempts?: number; hintsUsed?: number; timeSpentSeconds?: number },
): ActivityOutcome {
  const scorePercent = result.scorePercent ?? (result.total > 0 ? Math.round((result.score / result.total) * 100) : 100)
  return {
    activityId: result.activityId,
    activityType: result.activityType,
    status: 'completed',
    score: result.score,
    total: result.total,
    scorePercent,
    correctness: result.correctness ?? (scorePercent >= 90 ? 'complete' : scorePercent >= 70 ? 'partial' : 'needs-practice'),
    attempts: meta?.attempts ?? 1,
    hintsUsed: meta?.hintsUsed ?? 0,
    weakItemIndexes: result.weakItemIndexes,
    timeSpentSeconds: meta?.timeSpentSeconds,
    chapterId: result.chapterId,
    moduleId: result.moduleId,
  }
}

export function createSkippedActivityOutcome(params: {
  activityId: string
  activityType: string
  attempts?: number
  hintsUsed?: number
  chapterId?: string
  moduleId?: string
  reason?: string
}): ActivityOutcome {
  return {
    activityId: params.activityId,
    activityType: params.activityType,
    status: 'skipped',
    attempts: params.attempts ?? 0,
    hintsUsed: params.hintsUsed ?? 0,
    chapterId: params.chapterId,
    moduleId: params.moduleId,
    reason: params.reason ?? 'learner_skipped',
  }
}

export function createClosedActivityOutcome(params: {
  activityId: string
  activityType: string
  attempts?: number
  hintsUsed?: number
  chapterId?: string
  moduleId?: string
}): ActivityOutcome {
  return {
    activityId: params.activityId,
    activityType: params.activityType,
    status: 'closed',
    attempts: params.attempts ?? 0,
    hintsUsed: params.hintsUsed ?? 0,
    chapterId: params.chapterId,
    moduleId: params.moduleId,
  }
}
