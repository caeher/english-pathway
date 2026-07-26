import type { ActivityAdvancePolicy } from '@/types'

export const defaultScorePolicy: ActivityAdvancePolicy = { mode: 'score', passThreshold: 70 }

export const defaultCompletionPolicy: ActivityAdvancePolicy = { mode: 'completion' }

export const defaultChapterActivityFields = {
  required: true,
  policy: defaultScorePolicy,
}
