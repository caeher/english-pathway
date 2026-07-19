import { getDailyProgressUseCase } from '@/features/engagement'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET(request: Request) {
  const timezone = new URL(request.url).searchParams.get('timezone') ?? 'UTC'
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(async () => ({ progress: await getDailyProgressUseCase(context, timezone) }), 'Unable to load daily progress')
}
