import { mergeProgressUseCase } from '@/features/progress/use-cases'
import { mergeProgressSchema } from '@/features/progress/contracts'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function POST(request: Request) {
  const payload = mergeProgressSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid progress merge'), 'Invalid progress merge')

  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(
    async () => ({ ok: true as const, ...(await mergeProgressUseCase(context, payload.data)) }),
    'Unable to merge learning progress',
  )
}
