import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { getLearningContinuationUseCase } from '@/features/progress/use-cases'

export async function GET() {
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(async () => ({ continuation: await getLearningContinuationUseCase(context) }), 'Unable to choose the next learning step')
}
