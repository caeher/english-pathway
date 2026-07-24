import {
  deleteEnglishAssistantConversationUseCase,
  getEnglishAssistantConversationUseCase,
} from '@/features/english-assistant'
import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedContext()
  if (!auth) {
    return apiErrorResponse(
      new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use the English assistant.'),
      'Authentication required',
    )
  }

  const { id } = await context.params
  return respondWithApiErrors(
    () => getEnglishAssistantConversationUseCase(auth, id),
    'Unable to load conversation',
  )
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAuthenticatedContext()
  if (!auth) {
    return apiErrorResponse(
      new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use the English assistant.'),
      'Authentication required',
    )
  }

  const { id } = await context.params
  return respondWithApiErrors(async () => {
    await deleteEnglishAssistantConversationUseCase(auth, id)
    return { ok: true as const }
  }, 'Unable to delete conversation')
}
