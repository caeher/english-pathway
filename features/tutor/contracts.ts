import { z } from 'zod'
import { curriculumContextActionSchema, tutorSessionStateSchema } from '@/lib/tutor/schemas'
import { tutorMemoryDeleteSchema, tutorMemoryWriteSchema } from '@/lib/api/tutor-memory-schemas'

export const tutorContextRequestSchema = curriculumContextActionSchema.extend({
  matchCount: z.number().int().min(1).max(5).optional(),
})

export { tutorMemoryDeleteSchema, tutorMemoryWriteSchema, tutorSessionStateSchema }
export type TutorContextRequest = z.infer<typeof tutorContextRequestSchema>
export type TutorMemoryDeleteInput = z.infer<typeof tutorMemoryDeleteSchema>
export type TutorMemoryWriteInput = z.infer<typeof tutorMemoryWriteSchema>

export const tutorActivityResponseSchema = z.object({
  activity: z.unknown(),
  chapterId: z.string(),
  moduleId: z.string(),
})
export const tutorContextResponseSchema = z.object({ matches: z.array(z.unknown()), context: z.unknown() })
export const tutorMemoryResponseSchema = z.unknown()
