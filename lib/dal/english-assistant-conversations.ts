import type { SupabaseClient } from '@supabase/supabase-js'
import type { AssistantMessage } from '@/lib/english-assistant/schema'
import type { ActivityContext } from '@/lib/english-assistant/context'
import { activityContextSchema } from '@/lib/english-assistant/context'
import type { Database } from '@/lib/supabase/database.types'
import type { ConversationDetail, ConversationSummary } from '@/features/english-assistant/contracts'

type Client = SupabaseClient<Database>

const CONVERSATION_LIST_LIMIT = 20

function parseActivityContext(value: unknown): ActivityContext | null {
  const parsed = activityContextSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function deriveConversationTitle(firstUserMessage?: string): string {
  if (!firstUserMessage) return 'New conversation'
  const normalized = firstUserMessage.trim().replace(/\s+/g, ' ')
  if (!normalized) return 'New conversation'
  return normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized
}

export async function listEnglishAssistantConversations(
  supabase: Client,
  userId: string,
): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('english_assistant_conversations')
    .select('id, title, updated_at, activity_context')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(CONVERSATION_LIST_LIMIT)

  if (error) throw new Error(`Failed to list English assistant conversations: ${error.message}`)

  return (data ?? []).map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updated_at,
    hasContext: conversation.activity_context != null,
  }))
}

export async function getEnglishAssistantConversation(
  supabase: Client,
  userId: string,
  conversationId: string,
): Promise<ConversationDetail | null> {
  const { data: conversation, error } = await supabase
    .from('english_assistant_conversations')
    .select('id, title, updated_at, activity_context')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Failed to load English assistant conversation: ${error.message}`)
  if (!conversation) return null

  const { data: messages, error: messagesError } = await supabase
    .from('english_assistant_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (messagesError) throw new Error(`Failed to load English assistant messages: ${messagesError.message}`)

  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updated_at,
    activityContext: parseActivityContext(conversation.activity_context),
    messages: (messages ?? []).map((message) => ({
      role: message.role as AssistantMessage['role'],
      content: message.content,
    })),
  }
}

export async function createEnglishAssistantConversation(
  supabase: Client,
  userId: string,
  title?: string,
): Promise<ConversationSummary> {
  const { data, error } = await supabase
    .from('english_assistant_conversations')
    .insert({
      user_id: userId,
      title: title?.trim() || 'New conversation',
    })
    .select('id, title, updated_at, activity_context')
    .single()

  if (error) throw new Error(`Failed to create English assistant conversation: ${error.message}`)

  return {
    id: data.id,
    title: data.title,
    updatedAt: data.updated_at,
    hasContext: data.activity_context != null,
  }
}

export async function appendEnglishAssistantMessages(
  supabase: Client,
  userId: string,
  conversationId: string,
  messages: AssistantMessage[],
): Promise<void> {
  const { data: conversation, error: conversationError } = await supabase
    .from('english_assistant_conversations')
    .select('id, title')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (conversationError) throw new Error(`Failed to verify English assistant conversation: ${conversationError.message}`)
  if (!conversation) throw new Error('Conversation not found')

  const { error } = await supabase
    .from('english_assistant_messages')
    .insert(messages.map((message) => ({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
    })))

  if (error) throw new Error(`Failed to append English assistant messages: ${error.message}`)

  const firstUserMessage = messages.find((message) => message.role === 'user')?.content
  const shouldUpdateTitle = conversation.title === 'New conversation' && firstUserMessage

  if (shouldUpdateTitle) {
    const { error: titleError } = await supabase
      .from('english_assistant_conversations')
      .update({ title: deriveConversationTitle(firstUserMessage) })
      .eq('id', conversationId)
      .eq('user_id', userId)

    if (titleError) throw new Error(`Failed to update English assistant conversation title: ${titleError.message}`)
  }
}

export async function updateEnglishAssistantActivityContext(
  supabase: Client,
  userId: string,
  conversationId: string,
  context: ActivityContext,
): Promise<ConversationDetail> {
  const { data, error } = await supabase
    .from('english_assistant_conversations')
    .update({ activity_context: context })
    .eq('id', conversationId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) throw new Error(`Failed to update English assistant activity context: ${error.message}`)
  if (!data) throw new Error('Conversation not found')

  const conversation = await getEnglishAssistantConversation(supabase, userId, conversationId)
  if (!conversation) throw new Error('Conversation not found')
  return conversation
}

export async function deleteEnglishAssistantConversation(
  supabase: Client,
  userId: string,
  conversationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('english_assistant_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to delete English assistant conversation: ${error.message}`)
}

export async function getEnglishAssistantConversationMessagesForModel(
  supabase: Client,
  userId: string,
  conversationId: string,
): Promise<AssistantMessage[]> {
  const conversation = await getEnglishAssistantConversation(supabase, userId, conversationId)
  if (!conversation) throw new Error('Conversation not found')
  return conversation.messages.slice(-12)
}
