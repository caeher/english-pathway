import { z } from 'zod'

export const completeChapterSchema = z.object({
  chapterId: z.string().min(1).max(100),
})
