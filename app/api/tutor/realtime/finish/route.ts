import { z } from 'zod'
import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { finishAudioCreditSession } from '@/lib/credits/usage'

const finishSchema = z.object({ sessionId: z.string().uuid(), seconds: z.number().int().min(0).max(300) })

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use voice credits.'), 'Authentication required')
  const parsed = finishSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid voice session completion.'), 'Invalid voice session completion')
  return respondWithApiErrors(
    () => finishAudioCreditSession(context.supabase, parsed.data.sessionId, parsed.data.seconds),
    'Unable to update voice credits.',
  )
}
