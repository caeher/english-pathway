import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const dictationProgressSchema = z.object({
  current: z.number().int().min(0),
  value: z.string(),
  answered: z.boolean(),
  score: z.number().int().min(0),
  weakItemIndexes: z.array(z.number().int().min(0)),
})

export type DictationProgress = z.infer<typeof dictationProgressSchema>

export const dictationSnapshot: ActivitySnapshotContract<DictationProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: dictationProgressSchema,
  summarize: (payload) => `Dictation ${payload.current + 1} · Score ${payload.score}`,
  isRestorable: (payload) => payload.current >= 0,
}
