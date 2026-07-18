import { describe, expect, it } from 'vitest'
import { settingsSchema } from '@/lib/auth/schemas'
import { onboardingCompletionSchema } from '@/lib/onboarding/schemas'

describe('learning preferences contract', () => {
  it('accepts only supported account preference values', () => {
    expect(settingsSchema.safeParse({ fullName: 'Ada Learner', dailyGoalMinutes: 10, preferredMode: 'voice' }).success).toBe(true)
    expect(settingsSchema.safeParse({ fullName: 'A', dailyGoalMinutes: 15, preferredMode: 'audio' }).success).toBe(false)
  })

  it('carries preferred mode through onboarding without making it an assessment result', () => {
    const result = onboardingCompletionSchema.safeParse({ level: 'intermediate', dailyGoalMinutes: 20, preferredMode: 'text', skipped: false })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.preferredMode).toBe('text')
  })
})
