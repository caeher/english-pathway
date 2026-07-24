import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

const cardGradeSchema = z.enum(['recalled', 'unsure', 'missed'])

export const flashcardProgressSchema = z.object({
  current: z.number().int().min(0),
  revealed: z.boolean(),
  answered: z.boolean(),
  cardGrades: z.record(z.string().min(1), cardGradeSchema),
  weakItemIndexes: z.array(z.number().int().min(0)),
})

export type FlashcardProgress = z.infer<typeof flashcardProgressSchema>

export const flashcardSnapshot: ActivitySnapshotContract<FlashcardProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: flashcardProgressSchema,
  summarize: (payload) => {
    const recalled = Object.values(payload.cardGrades).filter((g) => g === 'recalled').length
    return `Card ${payload.current + 1} · ${recalled} recalled`
  },
  isRestorable: (payload) => payload.current >= 0,
}
