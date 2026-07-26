import { z } from 'zod'

import type { ActivityType } from '@/types'

export const DEFAULT_PASS_THRESHOLD = 70

/** Activity types approved by valid completion, not score threshold. */
export const COMPLETION_MODE_ACTIVITY_TYPES: readonly ActivityType[] = [
  'flashcard',
  'branching-dialogue',
]

export const activityAdvancePolicySchema = z.object({
  mode: z.enum(['score', 'completion']).default('score'),
  passThreshold: z.number().int().min(0).max(100).optional(),
}).superRefine((policy, ctx) => {
  if (policy.mode === 'completion' && policy.passThreshold !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'passThreshold is not allowed when mode is completion',
      path: ['passThreshold'],
    })
  }
})

export type ActivityAdvancePolicyInput = z.input<typeof activityAdvancePolicySchema>
export type ResolvedActivityAdvancePolicy =
  | { mode: 'score'; passThreshold: number }
  | { mode: 'completion' }

export const chapterActivitiesFileSchema = z.union([
  z.array(z.unknown()),
  z.object({
    policyVersion: z.number().int().min(1).optional(),
    activities: z.array(z.unknown()).min(1),
  }),
])

export type ChapterActivitiesFile = z.infer<typeof chapterActivitiesFileSchema>

export function parseChapterActivitiesFile(raw: unknown): {
  policyVersion: number | null
  activities: unknown[]
} {
  const parsed = chapterActivitiesFileSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '))
  }

  if (Array.isArray(parsed.data)) {
    return { policyVersion: null, activities: parsed.data }
  }

  return {
    policyVersion: parsed.data.policyVersion ?? 1,
    activities: parsed.data.activities,
  }
}

export function resolveActivityAdvancePolicy(
  policy?: ActivityAdvancePolicyInput | null,
): ResolvedActivityAdvancePolicy {
  const parsed = activityAdvancePolicySchema.parse(policy ?? {})
  if (parsed.mode === 'completion') {
    return { mode: 'completion' }
  }
  return {
    mode: 'score',
    passThreshold: parsed.passThreshold ?? DEFAULT_PASS_THRESHOLD,
  }
}

export function resolveActivityRequired(required?: boolean | null): boolean {
  return required ?? true
}

export interface ActivityAdvanceFields {
  required: boolean
  policy: ResolvedActivityAdvancePolicy
}

export function resolveActivityAdvanceFields(input: {
  required?: boolean | null
  policy?: ActivityAdvancePolicyInput | null
}): ActivityAdvanceFields {
  return {
    required: resolveActivityRequired(input.required),
    policy: resolveActivityAdvancePolicy(input.policy),
  }
}
