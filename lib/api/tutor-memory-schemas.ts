import { z } from 'zod'
import { tutorSessionStateSchema } from '@/lib/tutor/schemas'

const correlationId = z.string().min(1).max(128)
const summary = z.string().trim().min(1).max(2000).refine((value) => !/audio data|full transcript|password|secret|api[_ -]?key/i.test(value), 'Private raw data is not allowed')

export const tutorMemoryWriteSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('session_summary'),
    correlationId,
    state: tutorSessionStateSchema,
    summary,
    lastActivityId: z.string().min(1).max(160).optional(),
  }),
  z.object({
    type: z.literal('learner_memory'),
    memoryKey: z.string().trim().min(1).max(160),
    content: summary,
    source: z.enum(['activity_result', 'help_request', 'session_end', 'preference_update']),
  }),
])

export const tutorMemoryDeleteSchema = z.object({
  memoryKey: z.string().trim().min(1).max(160).optional(),
})

export type TutorMemoryWrite = z.infer<typeof tutorMemoryWriteSchema>
