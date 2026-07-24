import { attachEnglishAssistantActivityContextUseCase } from '@/features/english-assistant'
import { attachActivityContextSchema } from '@/features/english-assistant/contracts'
import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedContext()
  if (!auth) {
    return apiErrorResponse(
      new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use the English assistant.'),
      'Authentication required',
    )
  }

  const parsed = attachActivityContextSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiErrorResponse(
      new DomainError('INVALID_INPUT', 'Please send valid activity context.'),
      'Unable to attach activity context',
    )
  }

  const { id } = await context.params
  return respondWithApiErrors(
    () => attachEnglishAssistantActivityContextUseCase(auth, id, parsed.data),
    'Unable to attach activity context',
  )
}
