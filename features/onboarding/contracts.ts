import { z } from 'zod'
import {
  ASSESSMENT_VERSION,
  assessmentAnswersSchema,
  assessmentLevelSchema,
  assessmentSourceSchema,
  evaluateAssessment,
} from '@/lib/onboarding/assessment'

export {
  ASSESSMENT_VERSION,
  assessmentAnswersSchema,
  assessmentLevelSchema,
  assessmentSourceSchema,
  evaluateAssessment,
}

export const assessmentEvaluationSchema = z.object({
  source: assessmentSourceSchema,
  answers: assessmentAnswersSchema,
})

export const assessmentConfirmationSchema = z.object({
  level: assessmentLevelSchema,
  source: assessmentSourceSchema.default('self_assessment'),
  rubricVersion: z.string().optional(),
})

export type AssessmentEvaluationInput = z.infer<typeof assessmentEvaluationSchema>
export type AssessmentConfirmationInput = z.infer<typeof assessmentConfirmationSchema>

export const assessmentResultSchema = z.object({
  level: assessmentLevelSchema,
  score: z.number(),
  rubricVersion: z.string(),
  explanation: z.array(z.string()),
})
export const assessmentConfirmationResponseSchema = z.object({ confirmedLevel: assessmentLevelSchema })
export const assessmentVoiceResponseSchema = z.union([
  z.object({ configured: z.literal(false), textFallback: z.literal(true) }),
  z.object({ configured: z.literal(true), signedUrl: z.string().url() }),
])
