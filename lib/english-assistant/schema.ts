import { z } from 'zod'

export const assistantMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2_000),
})

export const assistantRequestSchema = z.object({
  messages: z.array(assistantMessageSchema).min(1).max(12),
}).refine((request) => request.messages.at(-1)?.role === 'user', {
  message: 'The final message must be from the user.',
})

export type AssistantMessage = z.infer<typeof assistantMessageSchema>
