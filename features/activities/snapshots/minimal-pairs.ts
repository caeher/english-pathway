import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const minimalPairsProgressSchema = z.object({
  current: z.number().int().min(0),
  phase: z.enum(['discriminate', 'practice']),
  playedVariant: z.enum(['A', 'B']).nullable(),
  selected: z.enum(['A', 'B']).nullable(),
  answered: z.boolean(),
  score: z.number().int().min(0),
  weakItemIndexes: z.array(z.number().int().min(0)),
  replaysUsed: z.number().int().min(0),
})

export type MinimalPairsProgress = z.infer<typeof minimalPairsProgressSchema>

export const minimalPairsSnapshot: ActivitySnapshotContract<MinimalPairsProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: minimalPairsProgressSchema,
  summarize: (payload) => `Pair ${payload.current + 1} · Score ${payload.score}`,
  isRestorable: (payload) => payload.current >= 0,
}
