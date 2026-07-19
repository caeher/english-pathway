/** Progress request schemas and their inferred input types. */
export {
  activityProgressSchema,
  chapterProgressSchema,
  gameProgressSchema,
  lastActivitySchema,
  mergeProgressSchema,
  type ActivityProgressInput,
  type ChapterProgressInput,
  type MergeProgressInput,
} from '@/lib/api/progress-schemas'

export const activityProgressResponseSchema = okResponseSchema.extend({ progress: z.unknown() })
export const chapterProgressResponseSchema = okResponseSchema.extend({ progress: z.unknown() })
export const mergeProgressResponseSchema = okResponseSchema.extend({
  activities: z.number().int().nonnegative(),
  chapters: z.number().int().nonnegative(),
})
export const lastProgressResponseSchema = z.object({ progress: z.unknown().nullable() })
import { z } from 'zod'
import { okResponseSchema } from '@/lib/api/contracts'
