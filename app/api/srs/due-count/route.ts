import { getReviewDueCountUseCase } from '@/features/srs'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET() {
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(async () => ({ count: await getReviewDueCountUseCase(context) }), 'Unable to count due reviews')
}
