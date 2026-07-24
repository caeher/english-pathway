import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const wordMatchProgressSchema = z.object({
  matchedLeftIndices: z.array(z.number().int().min(0)),
  attempts: z.number().int().min(0),
})

export type WordMatchProgress = z.infer<typeof wordMatchProgressSchema>

export const wordMatchSnapshot: ActivitySnapshotContract<WordMatchProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: wordMatchProgressSchema,
  summarize: (payload) => `${payload.matchedLeftIndices.length} pairs matched · ${payload.attempts} attempts`,
  isRestorable: (payload) => payload.matchedLeftIndices.length >= 0,
}
