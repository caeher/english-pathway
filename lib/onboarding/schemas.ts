import { z } from 'zod'

export const onboardingLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])
export const dailyGoalMinutesSchema = z.union([z.literal(5), z.literal(10), z.literal(20)])
export const preferredModeSchema = z.enum(['voice', 'text'])
export const onboardingStepSchema = z.number().int().min(0).max(4)

export const onboardingCompletionSchema = z
  .object({
    level: onboardingLevelSchema.nullish(),
    dailyGoalMinutes: dailyGoalMinutesSchema.nullish(),
    preferredMode: preferredModeSchema.nullish(),
    step: onboardingStepSchema.nullish(),
    skipped: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.skipped) return

    if (!value.level) {
      context.addIssue({
        code: 'custom',
        path: ['level'],
        message: 'Choose your English level before completing onboarding.',
      })
    }

    if (!value.dailyGoalMinutes) {
      context.addIssue({
        code: 'custom',
        path: ['dailyGoalMinutes'],
        message: 'Choose a daily goal before completing onboarding.',
      })
    }
  })

export type OnboardingLevel = z.infer<typeof onboardingLevelSchema>
export type DailyGoalMinutes = z.infer<typeof dailyGoalMinutesSchema>
export type PreferredMode = z.infer<typeof preferredModeSchema>
export type OnboardingCompletionInput = z.input<typeof onboardingCompletionSchema>

export const onboardingDraftSchema = z.object({
  step: onboardingStepSchema,
  level: onboardingLevelSchema.nullish(),
  dailyGoalMinutes: dailyGoalMinutesSchema.nullish(),
  preferredMode: preferredModeSchema.nullish(),
})
