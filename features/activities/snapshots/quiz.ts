import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const quizProgressSchema = z.object({
  current: z.number().int().min(0),
  selected: z.number().int().min(0).nullable(),
  fillValue: z.string(),
  answered: z.boolean(),
  score: z.number().int().min(0),
  weakItemIndexes: z.array(z.number().int().min(0)),
})

export type QuizProgress = z.infer<typeof quizProgressSchema>

export const quizSnapshot: ActivitySnapshotContract<QuizProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: quizProgressSchema,
  summarize: (payload) => `Question ${payload.current + 1} · Score ${payload.score}`,
  isRestorable: (payload) => payload.current >= 0,
}
