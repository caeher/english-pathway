import { persistEnglishAssistantTurn, resolveEnglishAssistantMessagesForModel } from '@/features/english-assistant'
import { recordSecurityInjectionSignal } from '@/lib/analytics/security-signal'
import { assistantRequestSchema } from '@/lib/english-assistant/schema'
import { streamEnglishAssistant } from '@/lib/english-assistant/openai'
import { encodeAssistantStreamEvent } from '@/lib/english-assistant/stream-events'
import { apiErrorResponse, DomainError } from '@/lib/api/errors'
import { getAuthenticatedContext } from '@/lib/api/context'
import { classifyInjectionSignal } from '@/lib/security/prompt-trust'
import { enforceRateLimit } from '@/lib/security/enforce-rate-limit'
import {
  completeEnglishAssistantPromptLog,
  createEnglishAssistantPromptLog,
  failEnglishAssistantPromptLog,
} from '@/lib/dal/english-assistant'
import { consumeAssistantCredit } from '@/lib/credits/usage'

const STREAM_TIMEOUT_MS = 20_000

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if (!context) {
    return apiErrorResponse(
      new DomainError('AUTHENTICATION_REQUIRED', 'Please sign in to use the English assistant.'),
      'Authentication required',
    )
  }

  const limited = await enforceRateLimit({
    request,
    route: '/api/english-assistant',
    userId: context.userId,
    supabase: context.supabase,
    surface: 'assistant',
  })
  if (limited) return limited

  const parsed = assistantRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return apiErrorResponse(
      new DomainError('INVALID_INPUT', 'Please send a valid English-learning question.'),
      'Unable to process the assistant request',
    )
  }

  try {
    const credit = await consumeAssistantCredit(context.supabase)
    if (!credit.allowed) {
      return apiErrorResponse(
        new DomainError('CREDITS_EXHAUSTED', 'Your 50 English assistant messages have been used.'),
        'Unable to process the assistant request',
      )
    }

    const injectionSignal = classifyInjectionSignal(parsed.data.message)
    await recordSecurityInjectionSignal(context.supabase, context.userId, 'assistant', injectionSignal)

    const resolved = await resolveEnglishAssistantMessagesForModel(
      context,
      parsed.data.conversationId,
      parsed.data.message,
    )
    const userMessage = resolved.messages.at(-1)!
    const logId = await createEnglishAssistantPromptLog(context.userId, userMessage.content)

    const encoder = new TextEncoder()
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
    }, STREAM_TIMEOUT_MS)

    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (chunk: string) => {
          if (timedOut) return
          controller.enqueue(encoder.encode(chunk))
        }

        const closeWithError = async (error: unknown) => {
          await failEnglishAssistantPromptLog(logId)
          const domainError = error instanceof DomainError ? error : null
          enqueue(encodeAssistantStreamEvent({
            event: 'error',
            data: {
              code: domainError?.code,
              error: domainError?.message ?? 'The English assistant is unavailable right now. Please try again shortly.',
            },
          }))
          controller.close()
        }

        try {
          if (timedOut) {
            throw new DomainError('TIMEOUT', 'The request took too long. Please try again.')
          }

          const answer = await streamEnglishAssistant(
            resolved.messages,
            resolved.activityContext,
            (accumulatedText) => {
              if (timedOut) return
              enqueue(encodeAssistantStreamEvent({
                event: 'delta',
                data: { text: accumulatedText },
              }))
            },
          )

          if (timedOut) {
            throw new DomainError('TIMEOUT', 'The request took too long. Please try again.')
          }

          await completeEnglishAssistantPromptLog(logId, answer)
          await persistEnglishAssistantTurn(
            context,
            resolved.conversationId,
            userMessage,
            { role: 'assistant', content: answer },
          )

          enqueue(encodeAssistantStreamEvent({
            event: 'done',
            data: {
              conversationId: resolved.conversationId,
              credits: credit.credits,
            },
          }))
          controller.close()
        } catch (error) {
          console.error(error)
          await closeWithError(error)
        } finally {
          clearTimeout(timeoutId)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error(error)
    return apiErrorResponse(error, 'The English assistant is unavailable right now. Please try again shortly.')
  }
}
