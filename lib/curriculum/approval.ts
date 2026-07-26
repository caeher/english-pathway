import type { ActivityAdvancePolicy, ChapterActivity } from '@/types'

export type ActivityApprovalReason =
  | 'score_threshold'
  | 'valid_completion'
  | 'below_threshold'
  | 'incomplete'

export interface ActivityApprovalResult {
  passed: boolean
  reason: ActivityApprovalReason
}

export interface ActivityAttemptInput {
  scorePercent?: number
  finished: boolean
}

export function evaluateActivityApproval(
  activity: Pick<ChapterActivity, 'policy'>,
  attempt: ActivityAttemptInput,
): ActivityApprovalResult {
  if (!attempt.finished) {
    return { passed: false, reason: 'incomplete' }
  }

  if (activity.policy.mode === 'completion') {
    return { passed: true, reason: 'valid_completion' }
  }

  const scorePercent = attempt.scorePercent
  if (typeof scorePercent !== 'number' || Number.isNaN(scorePercent)) {
    return { passed: false, reason: 'incomplete' }
  }

  if (scorePercent >= activity.policy.passThreshold) {
    return { passed: true, reason: 'score_threshold' }
  }

  return { passed: false, reason: 'below_threshold' }
}

export function isActivityPassed(
  activity: Pick<ChapterActivity, 'id' | 'policy'>,
  record?: { passed?: boolean | null; score?: number | null; status?: string | null } | null,
): boolean {
  if (record?.passed) return true
  if (!record || record.status !== 'completed') return false
  return evaluateActivityApproval(activity, {
    finished: true,
    scorePercent: record.score ?? undefined,
  }).passed
}

export function getRequiredActivities(chapter: { activities: ChapterActivity[] }): ChapterActivity[] {
  return chapter.activities.filter((activity) => activity.required)
}

export function getActivityPassThreshold(activity: Pick<ChapterActivity, 'policy'>): number | null {
  return activity.policy.mode === 'score' ? activity.policy.passThreshold : null
}
