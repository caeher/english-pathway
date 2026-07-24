import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

export const sentenceBuilderProgressSchema = z.object({
  current: z.number().int().min(0),
  placed: z.array(z.number().int().min(0)),
  checked: z.boolean(),
  score: z.number().int().min(0),
})

export type SentenceBuilderProgress = z.infer<typeof sentenceBuilderProgressSchema>

export const sentenceBuilderSnapshot: ActivitySnapshotContract<SentenceBuilderProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: sentenceBuilderProgressSchema,
  summarize: (payload) => `Sentence ${payload.current + 1} · Score ${payload.score}`,
  isRestorable: (payload) => payload.current >= 0,
}
