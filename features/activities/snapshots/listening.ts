import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const listeningProgressSchema = z.object({
  current: z.number().int().min(0),
  selected: z.number().int().min(0).nullable(),
  answered: z.boolean(),
  score: z.number().int().min(0),
  weakItemIndexes: z.array(z.number().int().min(0)),
})

export type ListeningProgress = z.infer<typeof listeningProgressSchema>

export const listeningSnapshot: ActivitySnapshotContract<ListeningProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: listeningProgressSchema,
  summarize: (payload) => `Audio ${payload.current + 1} · Score ${payload.score}`,
  isRestorable: (payload) => payload.current >= 0,
}
