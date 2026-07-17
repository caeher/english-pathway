import { z } from 'zod'

const srsQualitySchema = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
])

export const srsRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('enqueue'),
    contentRefs: z.array(z.string().min(1).max(240)).min(1).max(100),
  }),
  z.object({
    action: z.literal('review'),
    itemId: z.string().uuid(),
    quality: srsQualitySchema,
  }),
])
