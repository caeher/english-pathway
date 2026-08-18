import { z } from 'zod'
import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { heartbeatAudioCreditSession } from '@/lib/credits/usage'
import { enforceRateLimit } from '@/lib/security/enforce-rate-limit'

const heartbeatSchema = z.object({ sessionId: z.string().uuid() })
const REALTIME_HEARTBEAT_ROUTE = '/api/tutor/realtime/heartbeat'

async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    const text = await request.text()
    if (!text) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use voice credits.'), 'Authentication required')

  const limited = await enforceRateLimit({
    request,
    route: REALTIME_HEARTBEAT_ROUTE,
    userId: context.userId,
    supabase: context.supabase,
    surface: 'realtime',
  })
  if (limited) return limited

  const body = await parseRequestBody(request)
  const parsed = heartbeatSchema.safeParse(body)
  if (!parsed.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid heartbeat payload.'), 'Invalid heartbeat payload')

  return respondWithApiErrors(
    () => heartbeatAudioCreditSession(context.supabase, parsed.data.sessionId, context.userId),
    'Unable to update session heartbeat.',
  )
}
