import { saveChapterProgressUseCase } from '@/features/progress/use-cases'
import { chapterProgressSchema } from '@/features/progress/contracts'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function POST(request: Request) {
  const payload = chapterProgressSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid chapter progress'), 'Invalid chapter progress')

  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(
    async () => ({ ok: true as const, progress: await saveChapterProgressUseCase(context, payload.data) }),
    'Unable to save chapter progress',
  )
}
