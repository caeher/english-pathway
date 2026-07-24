import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const wordScrambleProgressSchema = z.object({
  current: z.number().int().min(0),
  selected: z.array(z.string()),
  placedIndices: z.array(z.number().int().min(0)),
  score: z.number().int().min(0),
})

export type WordScrambleProgress = z.infer<typeof wordScrambleProgressSchema>

export const wordScrambleSnapshot: ActivitySnapshotContract<WordScrambleProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: wordScrambleProgressSchema,
  summarize: (payload) => `Word ${payload.current + 1} · Score ${payload.score}`,
  isRestorable: (payload) => payload.current >= 0,
}
