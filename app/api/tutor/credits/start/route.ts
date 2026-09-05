import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { startAudioCreditSession } from '@/lib/credits/usage'
import { enforceRateLimit } from '@/lib/security/enforce-rate-limit'
import { hasActiveRealtimeSession } from '@/lib/security/realtime-concurrency'

const CREDITS_START_ROUTE = '/api/tutor/credits/start'

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if (!context) {
    return apiErrorResponse(
      new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use voice credits.'),
      'Authentication required',
    )
  }

  const limited = await enforceRateLimit({
    request,
    route: CREDITS_START_ROUTE,
    userId: context.userId,
    supabase: context.supabase,
    surface: 'realtime',
  })
  if (limited) return limited

  if (await hasActiveRealtimeSession(context.supabase, context.userId)) {
    return apiErrorResponse(
      new DomainError('CREDITS_EXHAUSTED', 'A voice session is already active.', 429),
      'Voice credits exhausted',
    )
  }

  return respondWithApiErrors(async () => {
    const credit = await startAudioCreditSession(context.supabase, context.userId)
    if (!credit.allowed || !credit.sessionId || !credit.maxSeconds) {
      throw new DomainError(
        'CREDITS_EXHAUSTED',
        credit.reason === 'active_session'
          ? 'A voice session is already active.'
          : 'Your voice lesson credits have been used.',
        429,
      )
    }

    return {
      sessionId: credit.sessionId,
      maxSeconds: credit.maxSeconds,
      isUnlimited: credit.isUnlimited ?? false,
    }
  }, 'Unable to start voice credit session.')
}
