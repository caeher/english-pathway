import {
  createEnglishAssistantConversationUseCase,
  listEnglishAssistantConversationsUseCase,
} from '@/features/english-assistant'
import { createConversationSchema } from '@/features/english-assistant/contracts'
import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'

export async function GET() {
  const context = await getAuthenticatedContext()
  if (!context) {
    return apiErrorResponse(
      new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use the English assistant.'),
      'Authentication required',
    )
  }

  return respondWithApiErrors(
    () => listEnglishAssistantConversationsUseCase(context),
    'Unable to load English assistant conversations',
  )
}

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if (!context) {
    return apiErrorResponse(
      new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use the English assistant.'),
      'Authentication required',
    )
  }

  const parsed = createConversationSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return apiErrorResponse(
      new DomainError('INVALID_INPUT', 'Please send a valid conversation request.'),
      'Unable to create conversation',
    )
  }

  return respondWithApiErrors(
    () => createEnglishAssistantConversationUseCase(context, parsed.data.title),
    'Unable to create conversation',
  )
}
