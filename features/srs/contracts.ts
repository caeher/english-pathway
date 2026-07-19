import { z } from 'zod'
import { srsRequestSchema } from '@/lib/api/srs-schemas'
import { apiErrorSchema, okResponseSchema } from '@/lib/api/contracts'

export { srsRequestSchema }
export type SrsRequest = z.infer<typeof srsRequestSchema>

export const srsEnqueueResponseSchema = okResponseSchema.extend({ enqueued: z.number().int().nonnegative() })
export const srsReviewResponseSchema = okResponseSchema.extend({ item: z.unknown() })
export const srsQueueResponseSchema = z.object({ items: z.array(z.unknown()) })
export const srsCountResponseSchema = z.object({ count: z.number().int().nonnegative() })
export { apiErrorSchema }
