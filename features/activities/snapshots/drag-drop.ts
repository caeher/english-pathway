import { z } from 'zod'
import { ACTIVITY_SNAPSHOT_VERSION, type ActivitySnapshotContract } from '../snapshot'

const matchProgressSchema = z.object({
  mode: z.literal('match'),
  matches: z.record(z.string(), z.string()),
  matchedCount: z.number().int().min(0),
})

const sentenceProgressSchema = z.object({
  mode: z.literal('sentence'),
  current: z.number().int().min(0),
  placed: z.array(z.string()),
  score: z.number().int().min(0),
})

export const dragDropProgressSchema = z.discriminatedUnion('mode', [
  matchProgressSchema,
  sentenceProgressSchema,
])

export type DragDropProgress = z.infer<typeof dragDropProgressSchema>

export const dragDropSnapshot: ActivitySnapshotContract<DragDropProgress> = {
  version: ACTIVITY_SNAPSHOT_VERSION,
  schema: dragDropProgressSchema,
  summarize: (payload) =>
    payload.mode === 'match'
      ? `${payload.matchedCount} pairs matched`
      : `Sentence ${payload.current + 1} · Score ${payload.score}`,
  isRestorable: (payload) =>
    payload.mode === 'match' ? payload.matchedCount >= 0 : payload.current >= 0,
}
