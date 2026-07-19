import { getTutorMemoryUseCase, saveTutorMemoryUseCase, deleteTutorMemoryUseCase, tutorMemoryDeleteSchema, tutorMemoryWriteSchema } from '@/features/tutor'
import { DomainError, apiErrorResponse, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET() {
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(() => getTutorMemoryUseCase(context), 'Unable to export private tutor data')
}

export async function POST(request: Request) {
  const parsed = tutorMemoryWriteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid private tutor memory payload'), 'Invalid private tutor memory payload')
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(async () => ({ ok: true as const, data: await saveTutorMemoryUseCase(context, parsed.data) }), 'Unable to save private tutor data')
}

export async function DELETE(request: Request) {
  const parsed = tutorMemoryDeleteSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return apiErrorResponse(new DomainError('INVALID_INPUT', 'Invalid deletion request'), 'Invalid deletion request')
  const context = await getAuthenticatedContext()
  if (!context) return apiErrorResponse(new DomainError('AUTHENTICATION_REQUIRED', 'Authentication required'), 'Authentication required')
  return respondWithApiErrors(async () => { await deleteTutorMemoryUseCase(context, parsed.data); return { ok: true as const } }, 'Unable to delete private tutor data')
}
