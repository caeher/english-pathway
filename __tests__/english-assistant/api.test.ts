import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { GET as listConversations, POST as createConversation } from '@/app/api/english-assistant/conversations/route'
import { GET as getConversation, DELETE as deleteConversation } from '@/app/api/english-assistant/conversations/[id]/route'
import { POST as sendAssistantMessage } from '@/app/api/english-assistant/route'
import { getEnglishAssistantConversation } from '@/lib/dal/english-assistant-conversations'

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
}))

const conversationId = '11111111-1111-4111-8111-111111111111'
const routeContext = { params: Promise.resolve({ id: conversationId }) }

function mockUnauthenticatedClient() {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  } as never)
}

function mockAuthenticatedClient() {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: vi.fn(),
  } as never)
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
})
