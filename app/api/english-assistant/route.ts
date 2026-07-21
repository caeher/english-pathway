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
      const prompt = parsed.data.messages.at(-1)!.content
      const logId = await createEnglishAssistantPromptLog(context.userId, prompt)

      try {
        const answer = await askEnglishAssistant(parsed.data.messages)
        await completeEnglishAssistantPromptLog(logId, answer)
        return { answer, credits: credit.credits }
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
