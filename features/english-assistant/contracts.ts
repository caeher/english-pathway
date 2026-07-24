import { z } from 'zod'
import { activityContextSchema } from '@/lib/english-assistant/context'
import { assistantMessageSchema } from '@/lib/english-assistant/schema'

export const conversationSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  updatedAt: z.string(),
  hasContext: z.boolean(),
})

export const conversationDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  updatedAt: z.string(),
  activityContext: activityContextSchema.nullable(),
  messages: z.array(assistantMessageSchema),
})

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
})

export const attachActivityContextSchema = z.object({
  context: activityContextSchema,
})

export type ConversationSummary = z.infer<typeof conversationSummarySchema>
export type ConversationDetail = z.infer<typeof conversationDetailSchema>
export type AttachActivityContextInput = z.infer<typeof attachActivityContextSchema>
