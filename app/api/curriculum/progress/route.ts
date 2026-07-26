import { completeChapterSchema } from '@/features/curriculum'
import { getCurriculumProgressUseCase } from '@/features/progress/use-cases'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET() {
  const context = await getAuthenticatedContext()
  if (!context) return Response.json({ authenticated: false, modules: [], resume: null })
  return respondWithApiErrors(async () => ({ authenticated: true, ...(await getCurriculumProgressUseCase(context)) }), 'Unable to load curriculum progress')
}

export async function POST(request: Request) {
  const payload = completeChapterSchema.safeParse(await request.json().catch(() => null))
  if (!payload.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid completion request'), 'Invalid completion request')
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return apiErrorResponse(
    new DomainError('CONFLICT', 'Chapter completion is derived from approved exercises and cannot be set manually.'),
    'Chapter completion is derived from approved exercises and cannot be set manually.',
  )
}
