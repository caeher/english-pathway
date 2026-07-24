import { persistEnglishAssistantTurn, resolveEnglishAssistantMessagesForModel } from '@/features/english-assistant'
import { assistantRequestSchema } from '@/lib/english-assistant/schema'
import { askEnglishAssistant } from '@/lib/english-assistant/openai'
import { apiErrorResponse, DomainError, respondWithApiErrors } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import {
  completeEnglishAssistantPromptLog,
  createEnglishAssistantPromptLog,
  failEnglishAssistantPromptLog,
} from '@/lib/dal/english-assistant'
import { consumeAssistantCredit } from '@/lib/credits/usage'

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if (!context) {
    return apiErrorResponse(
      new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use the English assistant.'),
      'Authentication required',
    )
  }

  const parsed = assistantRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiErrorResponse(
      new DomainError('INVALID_INPUT', 'Please send a valid English-learning question.'),
      'Unable to process the assistant request',
    )
  }

  return respondWithApiErrors(
    async () => {
      const credit = await consumeAssistantCredit(context.supabase)
      if (!credit.allowed) {
        throw new DomainError('CREDITS_EXHAUSTED', 'Your 50 English assistant messages have been used.')
      }

      const resolved = await resolveEnglishAssistantMessagesForModel(
        context,
        parsed.data.conversationId,
        parsed.data.messages,
      )
      const userMessage = resolved.messages.at(-1)!
      const logId = await createEnglishAssistantPromptLog(context.userId, userMessage.content)

      try {
        const answer = await askEnglishAssistant(resolved.messages, resolved.activityContext)
        await completeEnglishAssistantPromptLog(logId, answer)
        await persistEnglishAssistantTurn(
          context,
          resolved.conversationId,
          userMessage,
          { role: 'assistant', content: answer },
        )
        return {
          answer,
          conversationId: resolved.conversationId,
          credits: credit.credits,
        }
      } catch (error) {
        await failEnglishAssistantPromptLog(logId)
        throw error
      }
    },
    'The English assistant is unavailable right now. Please try again shortly.',
    undefined,
    20_000,
  )
}
