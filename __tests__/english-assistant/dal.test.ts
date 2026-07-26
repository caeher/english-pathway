import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import {
  appendEnglishAssistantMessages,
  createEnglishAssistantConversation,
  deleteEnglishAssistantConversation,
  getEnglishAssistantConversation,
  listEnglishAssistantConversations,
} from '@/lib/dal/english-assistant-conversations'

type Client = SupabaseClient<Database>

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const conversationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function createQueryBuilder(result: { data?: unknown; error?: { message: string } | null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
  }
  return builder
}

function createMockSupabase(handlers: Record<string, () => ReturnType<typeof createQueryBuilder>>) {
  return {
    from: vi.fn((table: string) => handlers[table]?.() ?? createQueryBuilder({ data: null, error: null })),
  } as unknown as Client
}

describe('english assistant conversations DAL', () => {
  it('lists conversations for the authenticated user ordered by updated_at desc', async () => {
    const conversations = [
      {
        id: conversationId,
        title: 'Grammar help',
        updated_at: '2026-07-24T12:00:00.000Z',
        activity_context: { activityId: 'a1' },
      },
      {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        title: 'Vocabulary',
        updated_at: '2026-07-23T12:00:00.000Z',
        activity_context: null,
      },
    ]

    const listBuilder = createQueryBuilder({ data: conversations, error: null })
    const supabase = createMockSupabase({
      english_assistant_conversations: () => listBuilder,
    })

    const result = await listEnglishAssistantConversations(supabase, userId)

    expect(listBuilder.eq).toHaveBeenCalledWith('user_id', userId)
    expect(listBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(listBuilder.limit).toHaveBeenCalledWith(20)
    expect(result).toEqual([
      {
        id: conversationId,
        title: 'Grammar help',
        updatedAt: '2026-07-24T12:00:00.000Z',
        hasContext: true,
      },
      {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        title: 'Vocabulary',
        updatedAt: '2026-07-23T12:00:00.000Z',
        hasContext: false,
      },
    ])
  })

  it('returns conversation detail with messages in chronological order', async () => {
    const conversationBuilder = createQueryBuilder({
      data: {
        id: conversationId,
        title: 'Grammar help',
        updated_at: '2026-07-24T12:00:00.000Z',
        activity_context: null,
      },
      error: null,
    })
    const messagesBuilder = createQueryBuilder({
      data: [
        { role: 'user', content: 'Explain present simple.' },
        { role: 'assistant', content: 'Present simple uses the base verb.' },
      ],
      error: null,
    })

    const supabase = createMockSupabase({
      english_assistant_conversations: () => conversationBuilder,
      english_assistant_messages: () => messagesBuilder,
    })

    const result = await getEnglishAssistantConversation(supabase, userId, conversationId)

    expect(conversationBuilder.eq).toHaveBeenCalledWith('id', conversationId)
    expect(conversationBuilder.eq).toHaveBeenCalledWith('user_id', userId)
    expect(messagesBuilder.eq).toHaveBeenCalledWith('conversation_id', conversationId)
    expect(messagesBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result?.messages).toEqual([
      { role: 'user', content: 'Explain present simple.' },
      { role: 'assistant', content: 'Present simple uses the base verb.' },
    ])
  })

  it('returns null when the conversation does not belong to the user', async () => {
    const conversationBuilder = createQueryBuilder({ data: null, error: null })
    const supabase = createMockSupabase({
      english_assistant_conversations: () => conversationBuilder,
    })

    const result = await getEnglishAssistantConversation(
      supabase,
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      conversationId,
    )

    expect(result).toBeNull()
    expect(conversationBuilder.eq).toHaveBeenCalledWith('user_id', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd')
  })

  it('creates a conversation with a default or custom title', async () => {
    const createBuilder = createQueryBuilder({
      data: {
        id: conversationId,
        title: 'Custom topic',
        updated_at: '2026-07-24T12:00:00.000Z',
        activity_context: null,
      },
      error: null,
    })
    const supabase = createMockSupabase({
      english_assistant_conversations: () => createBuilder,
    })

    const custom = await createEnglishAssistantConversation(supabase, userId, 'Custom topic')
    expect(createBuilder.insert).toHaveBeenCalledWith({
      user_id: userId,
      title: 'Custom topic',
    })
    expect(custom.title).toBe('Custom topic')

    const defaultTitle = await createEnglishAssistantConversation(supabase, userId)
    expect(createBuilder.insert).toHaveBeenLastCalledWith({
      user_id: userId,
      title: 'New conversation',
    })
    expect(defaultTitle.hasContext).toBe(false)
  })

  it('appends messages and derives the title from the first user message', async () => {
    const verifyBuilder = createQueryBuilder({
      data: { id: conversationId, title: 'New conversation' },
      error: null,
    })
    const insertBuilder = createQueryBuilder({ data: null, error: null })
    const updateBuilder = createQueryBuilder({ data: null, error: null })

    let conversationCall = 0
    const supabase = createMockSupabase({
      english_assistant_conversations: () => {
        conversationCall += 1
        return conversationCall === 1 ? verifyBuilder : updateBuilder
      },
      english_assistant_messages: () => insertBuilder,
    })

    await appendEnglishAssistantMessages(supabase, userId, conversationId, [
      { role: 'user', content: 'Explain present simple in one sentence.' },
      { role: 'assistant', content: 'Present simple describes habits and facts.' },
    ])

    expect(verifyBuilder.eq).toHaveBeenCalledWith('user_id', userId)
    expect(insertBuilder.insert).toHaveBeenCalledWith([
      {
        conversation_id: conversationId,
        role: 'user',
        content: 'Explain present simple in one sentence.',
      },
      {
        conversation_id: conversationId,
        role: 'assistant',
        content: 'Present simple describes habits and facts.',
      },
    ])
    expect(updateBuilder.update).toHaveBeenCalledWith({
      title: 'Explain present simple in one sentence.',
    })
    expect(updateBuilder.eq).toHaveBeenCalledWith('user_id', userId)
  })

  it('does not overwrite a user-chosen conversation title when appending messages', async () => {
    const verifyBuilder = createQueryBuilder({
      data: { id: conversationId, title: 'Grammar questions' },
      error: null,
    })
    const insertBuilder = createQueryBuilder({ data: null, error: null })
    const updateBuilder = createQueryBuilder({ data: null, error: null })

    const supabase = createMockSupabase({
      english_assistant_conversations: () => verifyBuilder,
      english_assistant_messages: () => insertBuilder,
    })

    await appendEnglishAssistantMessages(supabase, userId, conversationId, [
      { role: 'user', content: 'Explain present simple in one sentence.' },
      { role: 'assistant', content: 'Present simple describes habits and facts.' },
    ])

    expect(updateBuilder.update).not.toHaveBeenCalled()
  })

  it('throws when appending messages to a missing conversation', async () => {
    const verifyBuilder = createQueryBuilder({ data: null, error: null })
    const supabase = createMockSupabase({
      english_assistant_conversations: () => verifyBuilder,
    })

    await expect(
      appendEnglishAssistantMessages(supabase, userId, conversationId, [
        { role: 'user', content: 'Hello' },
      ]),
    ).rejects.toThrow('Conversation not found')
  })

  it('deletes a conversation scoped to the authenticated user', async () => {
    const deleteBuilder = createQueryBuilder({ data: null, error: null })
    const supabase = createMockSupabase({
      english_assistant_conversations: () => deleteBuilder,
    })

    await deleteEnglishAssistantConversation(supabase, userId, conversationId)

    expect(deleteBuilder.delete).toHaveBeenCalled()
    expect(deleteBuilder.eq).toHaveBeenCalledWith('id', conversationId)
    expect(deleteBuilder.eq).toHaveBeenCalledWith('user_id', userId)
  })
})
