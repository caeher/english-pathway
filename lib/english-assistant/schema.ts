import { z } from 'zod'

export const assistantMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2_000),
})

export const assistantRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2_000),
})

export type AssistantMessage = z.infer<typeof assistantMessageSchema>
