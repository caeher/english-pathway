import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { GET as listConversations, POST as createConversation } from '@/app/api/english-assistant/conversations/route'
import { GET as getConversation, DELETE as deleteConversation } from '@/app/api/english-assistant/conversations/[id]/route'
import { POST as sendAssistantMessage } from '@/app/api/english-assistant/route'
import { getEnglishAssistantConversation } from '@/lib/dal/english-assistant-conversations'
import { resolveEnglishAssistantMessagesForModel } from '@/features/english-assistant'
import { resolveEnglishAssistantLearnerContext } from '@/lib/english-assistant/learner-context'
import { streamEnglishAssistant } from '@/lib/english-assistant/openai'
import { assistantRequestSchema } from '@/lib/english-assistant/schema'
import { consumeAssistantCredit } from '@/lib/credits/usage'
import { createAssistantStreamParser } from '@/lib/english-assistant/stream-events'

const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: vi.fn(async () => null),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/dal/english-assistant-conversations', () => ({
  listEnglishAssistantConversations: vi.fn(async () => []),
  createEnglishAssistantConversation: vi.fn(async () => ({
    id: '11111111-1111-4111-8111-111111111111',
    title: 'New conversation',
    updatedAt: '2026-07-24T00:00:00.000Z',
    hasContext: false,
  })),
  getEnglishAssistantConversation: vi.fn(),
  deleteEnglishAssistantConversation: vi.fn(async () => undefined),
  appendEnglishAssistantMessages: vi.fn(async () => undefined),
  getEnglishAssistantConversationMessagesForModel: vi.fn(async () => []),
}))
vi.mock('@/features/english-assistant', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/english-assistant')>()
  return {
    ...actual,
    resolveEnglishAssistantMessagesForModel: vi.fn(),
    persistEnglishAssistantTurn: vi.fn(async () => undefined),
  }
})
vi.mock('@/lib/english-assistant/openai', () => ({
  streamEnglishAssistant: vi.fn(),
}))
vi.mock('@/lib/english-assistant/learner-context', () => ({
  resolveEnglishAssistantLearnerContext: vi.fn(),
}))
vi.mock('@/lib/credits/usage', () => ({
  consumeAssistantCredit: vi.fn(),
}))
vi.mock('@/lib/dal/english-assistant', () => ({
  createEnglishAssistantPromptLog: vi.fn(async () => 'log-1'),
  completeEnglishAssistantPromptLog: vi.fn(async () => undefined),
  failEnglishAssistantPromptLog: vi.fn(async () => undefined),
}))
vi.mock('@/lib/analytics/security-signal', () => ({
  recordSecurityInjectionSignal: vi.fn(async () => undefined),
}))
vi.mock('@/lib/security/enforce-rate-limit', () => ({
  enforceRateLimit: vi.fn(async () => null),
}))

const conversationId = '11111111-1111-4111-8111-111111111111'
const routeContext = { params: Promise.resolve({ id: conversationId }) }

function mockUnauthenticatedClient() {
  mockAuth.mockResolvedValue({ userId: null })
}

function mockAuthenticatedClient() {
  mockAuth.mockResolvedValue({ userId: 'user-1' })
}

describe('english assistant API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated conversation list requests', async () => {
    mockUnauthenticatedClient()
    const response = await listConversations()
    expect(response.status).toBe(401)
  })

  it('rejects unauthenticated conversation creation requests', async () => {
    mockUnauthenticatedClient()
    const response = await createConversation(new Request('http://localhost/api/english-assistant/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: 'Grammar help' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(401)
  })

  it('rejects unauthenticated conversation detail requests', async () => {
    mockUnauthenticatedClient()
    const response = await getConversation(new Request('http://localhost'), routeContext)
    expect(response.status).toBe(401)
  })

  it('rejects unauthenticated conversation delete requests', async () => {
    mockUnauthenticatedClient()
    const response = await deleteConversation(new Request('http://localhost'), routeContext)
    expect(response.status).toBe(401)
  })

  it('rejects unauthenticated assistant message requests', async () => {
    mockUnauthenticatedClient()
    const response = await sendAssistantMessage(new Request('http://localhost/api/english-assistant', {
      method: 'POST',
      body: JSON.stringify({ message: 'Explain present simple.' }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(401)
  })

  it('returns NOT_FOUND when loading another users conversation', async () => {
    mockAuthenticatedClient()
    vi.mocked(getEnglishAssistantConversation).mockResolvedValue(null)

    const response = await getConversation(new Request('http://localhost'), routeContext)
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload).toMatchObject({
      code: 'NOT_FOUND',
      error: 'Conversation not found',
    })
  })

  it('rejects invalid conversation creation payloads', async () => {
    mockAuthenticatedClient()

    const response = await createConversation(new Request('http://localhost/api/english-assistant/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
      headers: { 'content-type': 'application/json' },
    }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload).toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects assistant payloads with unsupported profile fields', async () => {
    const parsed = assistantRequestSchema.safeParse({
      conversationId,
      message: 'Explain present simple.',
      level: 'advanced',
    })

    expect(parsed.success).toBe(false)
  })

  it('does not resolve learner context when the conversation is not owned by the user', async () => {
    mockAuthenticatedClient()
    vi.mocked(consumeAssistantCredit).mockResolvedValue({
      allowed: true,
      credits: { assistantMessagesRemaining: 49, audioSecondsRemaining: 1200 },
    })
    vi.mocked(resolveEnglishAssistantMessagesForModel).mockRejectedValue(
      new DomainError('NOT_FOUND', 'Conversation not found'),
    )

    const response = await sendAssistantMessage(new Request('http://localhost/api/english-assistant', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        message: 'Explain present simple.',
      }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(404)
    expect(resolveEnglishAssistantLearnerContext).not.toHaveBeenCalled()
    expect(streamEnglishAssistant).not.toHaveBeenCalled()
  })

  it('streams assistant replies as SSE delta and done events', async () => {
    mockAuthenticatedClient()
    vi.mocked(consumeAssistantCredit).mockResolvedValue({
      allowed: true,
      credits: { assistantMessagesRemaining: 49, audioSecondsRemaining: 1200 },
    })
    vi.mocked(resolveEnglishAssistantMessagesForModel).mockResolvedValue({
      conversationId,
      messages: [{ role: 'user', content: 'Explain present simple.' }],
      activityContext: null,
    })
    vi.mocked(resolveEnglishAssistantLearnerContext).mockResolvedValue({ level: 'beginner' })
    vi.mocked(streamEnglishAssistant).mockImplementation(async (_messages, _context, learnerContext, onDelta) => {
      expect(learnerContext).toEqual({ level: 'beginner' })
      onDelta('Present simple', 'Present simple')
      return 'Present simple'
    })

    const response = await sendAssistantMessage(new Request('http://localhost/api/english-assistant', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        message: 'Explain present simple.',
      }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const body = await response.text()
    const events = createAssistantStreamParser().push(body)
    expect(events.some((event) => event.event === 'delta' && event.data.text === 'Present simple')).toBe(true)
    expect(events.some((event) => event.event === 'done' && event.data.conversationId === conversationId)).toBe(true)
    expect(events.some((event) => event.event === 'done' && 'level' in event.data)).toBe(false)
  })

  it('passes each authenticated user their own learner context without cross-account leakage', async () => {
    mockAuthenticatedClient()
    vi.mocked(consumeAssistantCredit).mockResolvedValue({
      allowed: true,
      credits: { assistantMessagesRemaining: 49, audioSecondsRemaining: 1200 },
    })
    vi.mocked(resolveEnglishAssistantMessagesForModel).mockResolvedValue({
      conversationId,
      messages: [{ role: 'user', content: 'Explain present simple.' }],
      activityContext: null,
    })

    vi.mocked(resolveEnglishAssistantLearnerContext).mockResolvedValueOnce({ level: 'beginner' })
    vi.mocked(streamEnglishAssistant).mockImplementationOnce(async (_messages, _context, learnerContext) => {
      expect(learnerContext).toEqual({ level: 'beginner' })
      return 'Beginner reply'
    })

    await sendAssistantMessage(new Request('http://localhost/api/english-assistant', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message: 'Explain present simple.' }),
      headers: { 'content-type': 'application/json' },
    }))

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-2' } },
        }),
      },
      from: vi.fn(),
    } as never)

    vi.mocked(resolveEnglishAssistantLearnerContext).mockResolvedValueOnce({ level: 'advanced' })
    vi.mocked(streamEnglishAssistant).mockImplementationOnce(async (_messages, _context, learnerContext) => {
      expect(learnerContext).toEqual({ level: 'advanced' })
      return 'Advanced reply'
    })

    await sendAssistantMessage(new Request('http://localhost/api/english-assistant', {
      method: 'POST',
      body: JSON.stringify({ conversationId, message: 'Explain subjunctive mood.' }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(resolveEnglishAssistantLearnerContext).toHaveBeenCalledTimes(2)
  })
})
