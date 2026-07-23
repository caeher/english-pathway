import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const flashcardProgressSchema = z.object({
  current: z.number().int().min(0),
  flipped: z.boolean(),
  knownIds: z.array(z.string().min(1)),
})

export type FlashcardProgress = z.infer<typeof flashcardProgressSchema>

export const flashcardSnapshot: ActivitySnapshotContract<FlashcardProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: flashcardProgressSchema,
  summarize: (payload) => `Card ${payload.current + 1} · ${payload.knownIds.length} known`,
  isRestorable: (payload) => payload.current >= 0,
}
