import { describe, expect, it, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/tutor/realtime/heartbeat/route'
import * as contextModule from '@/lib/api/context'
import { heartbeatAudioCreditSession } from '@/lib/credits/usage'
import * as rateLimitModule from '@/lib/security/enforce-rate-limit'

vi.mock('@/lib/credits/usage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/credits/usage')>()
  return {
    ...actual,
    heartbeatAudioCreditSession: vi.fn(),
  }
})

describe('POST /api/tutor/realtime/heartbeat', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(rateLimitModule, 'enforceRateLimit').mockResolvedValue(null)
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue(null)

    const request = new Request('http://localhost/api/tutor/realtime/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: '11111111-2222-3333-4444-555555555555',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('accepts standard JSON heartbeat payload', async () => {
    const mockSupabase = { rpc: vi.fn() } as unknown as contextModule.AppSupabaseClient
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue({
      userId: 'user-123',
      supabase: mockSupabase,
    })

    vi.mocked(heartbeatAudioCreditSession).mockResolvedValue({
      sessionId: '11111111-1111-4111-8111-111111111111',
      elapsed: 30,
      remaining: 1170,
    })

    const request = new Request('http://localhost/api/tutor/realtime/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: '11111111-1111-4111-8111-111111111111',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.sessionId).toBe('11111111-1111-4111-8111-111111111111')
    expect(json.elapsed).toBe(30)
    expect(json.remaining).toBe(1170)
    expect(heartbeatAudioCreditSession).toHaveBeenCalledWith(
      mockSupabase,
      '11111111-1111-4111-8111-111111111111',
      'user-123',
    )
  })

  it('accepts text/plain beacon heartbeat payload', async () => {
    const mockSupabase = { rpc: vi.fn() } as unknown as contextModule.AppSupabaseClient
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue({
      userId: 'user-123',
      supabase: mockSupabase,
    })

    vi.mocked(heartbeatAudioCreditSession).mockResolvedValue({
      sessionId: '22222222-2222-4222-8222-222222222222',
      elapsed: 60,
      remaining: 1140,
    })

    const request = new Request('http://localhost/api/tutor/realtime/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        sessionId: '22222222-2222-4222-8222-222222222222',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.sessionId).toBe('22222222-2222-4222-8222-222222222222')
    expect(heartbeatAudioCreditSession).toHaveBeenCalledWith(
      mockSupabase,
      '22222222-2222-4222-8222-222222222222',
      'user-123',
    )
  })

  it('rejects invalid uuid in session id with 400', async () => {
    const mockSupabase = { rpc: vi.fn() } as unknown as contextModule.AppSupabaseClient
    vi.spyOn(contextModule, 'getAuthenticatedContext').mockResolvedValue({
      userId: 'user-123',
      supabase: mockSupabase,
    })

    const request = new Request('http://localhost/api/tutor/realtime/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'invalid-session-id',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
