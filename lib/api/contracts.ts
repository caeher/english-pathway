import { z } from 'zod'

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>

export const okResponseSchema = z.object({ ok: z.literal(true) })

export type OkResponse = z.infer<typeof okResponseSchema>
