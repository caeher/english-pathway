import { engagementSessionSchema, recordEngagementSessionUseCase } from '@/features/engagement'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function POST(request: Request) {
  const payload = engagementSessionSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid engagement session'), 'Invalid engagement session')
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(() => recordEngagementSessionUseCase(context, payload.data), 'Unable to record engagement session')
}
