import { srsRequestSchema, updateReviewQueueUseCase } from '@/features/srs'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function POST(request: Request) {
  const payload = srsRequestSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid SRS request'), 'Invalid SRS request')
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(() => updateReviewQueueUseCase(context, payload.data), 'Unable to update review queue')
}
