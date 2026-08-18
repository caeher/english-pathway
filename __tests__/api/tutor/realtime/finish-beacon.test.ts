import { describe, expect, it, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/tutor/realtime/finish/route'
import * as contextModule from '@/lib/api/context'
import { finishAudioCreditSession } from '@/lib/credits/usage'
import * as rateLimitModule from '@/lib/security/enforce-rate-limit'

vi.mock('@/lib/credits/usage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/credits/usage')>()
  return {
    ...actual,
    finishAudioCreditSession: vi.fn(),
  }
})

describe('POST /api/tutor/realtime/finish (JSON and beacon format)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(rateLimitModule, 'enforceRateLimit').mockResolvedValue(null)
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue(null)

    const request = new Request('http://localhost/api/tutor/realtime/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: '11111111-2222-3333-4444-555555555555',
        seconds: 25,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('accepts standard JSON payload', async () => {
    const mockSupabase = { rpc: vi.fn() } as unknown as contextModule.AppSupabaseClient
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue({
      userId: 'user-123',
      supabase: mockSupabase,
    })

    vi.mocked(finishAudioCreditSession).mockResolvedValue({
      audioSecondsRemaining: 1175,
      assistantMessagesRemaining: 50,
    })

    const request = new Request('http://localhost/api/tutor/realtime/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: '11111111-1111-4111-8111-111111111111',
        seconds: 25,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.audioSecondsRemaining).toBe(1175)
    expect(finishAudioCreditSession).toHaveBeenCalledWith(
      mockSupabase,
      '11111111-1111-4111-8111-111111111111',
      25,
    )
  })

  it('accepts text/plain beacon payload (navigator.sendBeacon)', async () => {
    const mockSupabase = { rpc: vi.fn() } as unknown as contextModule.AppSupabaseClient
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue({
      userId: 'user-123',
      supabase: mockSupabase,
    })

    vi.mocked(finishAudioCreditSession).mockResolvedValue({
      audioSecondsRemaining: 1160,
      assistantMessagesRemaining: 50,
    })

    const request = new Request('http://localhost/api/tutor/realtime/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        sessionId: '22222222-2222-4222-8222-222222222222',
        seconds: 40,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.audioSecondsRemaining).toBe(1160)
    expect(finishAudioCreditSession).toHaveBeenCalledWith(
      mockSupabase,
      '22222222-2222-4222-8222-222222222222',
      40,
    )
  })

  it('rejects invalid uuid in session id with 400', async () => {
    const mockSupabase = { rpc: vi.fn() } as unknown as contextModule.AppSupabaseClient
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue({
      userId: 'user-123',
      supabase: mockSupabase,
    })

    const request = new Request('http://localhost/api/tutor/realtime/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'not-a-uuid',
        seconds: 10,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('rejects negative or out-of-bound seconds with 400', async () => {
    const mockSupabase = { rpc: vi.fn() } as unknown as contextModule.AppSupabaseClient
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue({
      userId: 'user-123',
      supabase: mockSupabase,
    })

    const request = new Request('http://localhost/api/tutor/realtime/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: '11111111-2222-3333-4444-555555555555',
        seconds: -5,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
