import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainError } from '@/lib/api/errors'
import {
  getEnglishAssistantConversationUseCase,
  persistEnglishAssistantTurn,
  resolveEnglishAssistantMessagesForModel,
} from '@/features/english-assistant/use-cases'
import {
  appendEnglishAssistantMessages,
  createEnglishAssistantConversation,
  getEnglishAssistantConversation,
  getEnglishAssistantConversationMessagesForModel,
} from '@/lib/dal/english-assistant-conversations'

const conversationId = '11111111-1111-4111-8111-111111111111'

const mockContext = {
  supabase: {} as never,
  userId: 'user-1',
  user: { id: 'user-1' } as never,
}

vi.mock('@/lib/dal/english-assistant-conversations', () => ({
  appendEnglishAssistantMessages: vi.fn(),
  createEnglishAssistantConversation: vi.fn(),
  deleteEnglishAssistantConversation: vi.fn(),
  getEnglishAssistantConversation: vi.fn(),
  getEnglishAssistantConversationMessagesForModel: vi.fn(),
  listEnglishAssistantConversations: vi.fn(),
  updateEnglishAssistantActivityContext: vi.fn(),
}))

describe('english assistant use cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws NOT_FOUND when a conversation does not belong to the user', async () => {
    vi.mocked(getEnglishAssistantConversation).mockResolvedValue(null)

    await expect(
      getEnglishAssistantConversationUseCase(mockContext, conversationId),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Conversation not found',
    } satisfies Partial<DomainError>)
  })

  it('throws INVALID_INPUT when resolving messages without a conversation id', async () => {
    await expect(
      resolveEnglishAssistantMessagesForModel(mockContext, undefined, 'Explain present simple.'),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      message: 'A conversation is required. Create one with a name before sending a message.',
    } satisfies Partial<DomainError>)

    expect(createEnglishAssistantConversation).not.toHaveBeenCalled()
  })

  it('throws NOT_FOUND when resolving messages for another users conversation', async () => {
    vi.mocked(getEnglishAssistantConversation).mockResolvedValue(null)

    await expect(
      resolveEnglishAssistantMessagesForModel(mockContext, conversationId, 'Follow up question'),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Conversation not found',
    } satisfies Partial<DomainError>)
  })

  it('appends the latest user message when it is not already persisted', async () => {
    vi.mocked(getEnglishAssistantConversation).mockResolvedValue({
      id: conversationId,
      title: 'Grammar help',
      updatedAt: '2026-07-24T00:00:00.000Z',
      activityContext: null,
      messages: [{ role: 'user', content: 'Earlier question.' }],
    })
    vi.mocked(getEnglishAssistantConversationMessagesForModel).mockResolvedValue([
      { role: 'user', content: 'Earlier question.' },
      { role: 'assistant', content: 'Earlier answer.' },
    ])

    const resolved = await resolveEnglishAssistantMessagesForModel(
      mockContext,
      conversationId,
      'Can you give me another example?',
    )

    expect(resolved.messages).toEqual([
      { role: 'user', content: 'Earlier question.' },
      { role: 'assistant', content: 'Earlier answer.' },
      { role: 'user', content: 'Can you give me another example?' },
    ])
  })

  it('persists a user and assistant turn through the DAL', async () => {
    const userMessage = { role: 'user' as const, content: 'Explain present simple.' }
    const assistantMessage = { role: 'assistant' as const, content: 'Present simple uses the base verb.' }

    await persistEnglishAssistantTurn(mockContext, conversationId, userMessage, assistantMessage)

    expect(appendEnglishAssistantMessages).toHaveBeenCalledWith(
      mockContext.supabase,
      mockContext.userId,
      conversationId,
      [userMessage, assistantMessage],
    )
  })
})
