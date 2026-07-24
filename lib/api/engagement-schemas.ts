import { z } from 'zod'
import type { ActivityType } from '@/types'

const activityTypes: [ActivityType, ...ActivityType[]] = [
  'flashcard', 'word-match', 'sentence-builder', 'quiz',
  'word-scramble', 'listening', 'dictation', 'pronunciation',
]

export const engagementSessionSchema = z.object({
  activityId: z.string().min(1).max(160),
  activityType: z.enum(activityTypes),
  scorePercent: z.number().min(0).max(100),
  durationMinutes: z.number().int().min(1).max(120).default(1),
  timezone: z.string().min(1).max(100).default('UTC'),
})

export type EngagementSessionInput = z.infer<typeof engagementSessionSchema>
