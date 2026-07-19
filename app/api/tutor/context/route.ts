import { tutorContextRequestSchema, buildTutorContextUseCase } from '@/features/tutor'
import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function POST(request: Request) {
  const parsed = tutorContextRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid curriculum context request'), 'Invalid curriculum context request')
  const context = await getAuthenticatedContext()
  return respondWithApiErrors(() => buildTutorContextUseCase(context, parsed.data), 'Unable to build tutor context')
}
