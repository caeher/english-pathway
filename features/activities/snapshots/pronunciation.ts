import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const pronunciationProgressSchema = z.object({
  current: z.number().int().min(0),
  bestScores: z.array(z.number().min(0).max(100)),
})

export type PronunciationProgress = z.infer<typeof pronunciationProgressSchema>

export const pronunciationSnapshot: ActivitySnapshotContract<PronunciationProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: pronunciationProgressSchema,
  summarize: (payload) => `Speaking phrase ${payload.current + 1}`,
  isRestorable: (payload) => payload.current >= 0 && payload.bestScores.length > 0,
}
