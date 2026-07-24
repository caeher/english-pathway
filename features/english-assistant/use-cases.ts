import type { AuthenticatedContext } from '@/lib/api/context'
import { DomainError } from '@/lib/api/errors'
import type { ActivityContext } from '@/lib/english-assistant/context'
import type { AssistantMessage } from '@/lib/english-assistant/schema'
import {
  appendEnglishAssistantMessages,
  createEnglishAssistantConversation,
  deleteEnglishAssistantConversation,
  getEnglishAssistantConversation,
  getEnglishAssistantConversationMessagesForModel,
  listEnglishAssistantConversations,
  updateEnglishAssistantActivityContext,
} from '@/lib/dal/english-assistant-conversations'
import type { AttachActivityContextInput } from './contracts'

export async function listEnglishAssistantConversationsUseCase(context: AuthenticatedContext) {
  return listEnglishAssistantConversations(context.supabase, context.userId)
}

export async function getEnglishAssistantConversationUseCase(
  context: AuthenticatedContext,
  conversationId: string,
) {
  const conversation = await getEnglishAssistantConversation(context.supabase, context.userId, conversationId)
  if (!conversation) throw new DomainError('NOT_FOUND', 'Conversation not found')
  return conversation
}

export async function createEnglishAssistantConversationUseCase(
  context: AuthenticatedContext,
  title?: string,
) {
  return createEnglishAssistantConversation(context.supabase, context.userId, title)
}

export async function deleteEnglishAssistantConversationUseCase(
  context: AuthenticatedContext,
  conversationId: string,
) {
  await deleteEnglishAssistantConversation(context.supabase, context.userId, conversationId)
}

export async function attachEnglishAssistantActivityContextUseCase(
  context: AuthenticatedContext,
  conversationId: string,
  input: AttachActivityContextInput,
) {
  return updateEnglishAssistantActivityContext(
    context.supabase,
    context.userId,
    conversationId,
    input.context,
  )
}

export async function resolveEnglishAssistantMessagesForModel(
  context: AuthenticatedContext,
  conversationId: string | undefined,
  userMessage: string,
): Promise<{ conversationId: string; messages: AssistantMessage[]; activityContext: ActivityContext | null }> {
  const latestUserMessage: AssistantMessage = { role: 'user', content: userMessage }

  if (!conversationId) {
    const created = await createEnglishAssistantConversation(context.supabase, context.userId)
    return {
      conversationId: created.id,
      messages: [latestUserMessage],
      activityContext: null,
    }
  }

  const conversation = await getEnglishAssistantConversation(context.supabase, context.userId, conversationId)
  if (!conversation) throw new DomainError('NOT_FOUND', 'Conversation not found')

  const messages = await getEnglishAssistantConversationMessagesForModel(
    context.supabase,
    context.userId,
    conversationId,
  )

  const persistedLatest = messages.at(-1)
  if (!persistedLatest || persistedLatest.role !== 'user' || persistedLatest.content !== latestUserMessage.content) {
    messages.push(latestUserMessage)
  }

  return {
    conversationId,
    messages: messages.slice(-12),
    activityContext: conversation.activityContext,
  }
}

export async function persistEnglishAssistantTurn(
  context: AuthenticatedContext,
  conversationId: string,
  userMessage: AssistantMessage,
  assistantMessage: AssistantMessage,
) {
  await appendEnglishAssistantMessages(context.supabase, context.userId, conversationId, [
    userMessage,
    assistantMessage,
  ])
}
