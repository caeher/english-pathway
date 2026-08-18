import { describe, expect, it, vi } from 'vitest'
import {
  AUDIO_CREDIT_SECONDS,
  finishAudioCreditSession,
  getUsageCredits,
  heartbeatAudioCreditSession,
  startAudioCreditSession,
} from '@/lib/credits/usage'
import type { AppSupabaseClient } from '@/lib/api/context'

describe('audio credit session lifecycle', () => {
  it('loads usage credits with active session state and elapsed deductions', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          audioSecondsRemaining: 1150,
          assistantMessagesRemaining: 50,
          hasActiveSession: true,
          activeSessionElapsed: 50,
        },
        error: null,
      }),
    } as unknown as AppSupabaseClient

    const credits = await getUsageCredits(mockSupabase, 'user-123')

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_usage_credits', { p_user_id: 'user-123' })
    expect(credits.audioSecondsRemaining).toBe(1150)
    expect(credits.assistantMessagesRemaining).toBe(50)
    expect(credits.hasActiveSession).toBe(true)
    expect(credits.activeSessionElapsed).toBe(50)
  })

  it('starts an audio credit session and receives lease metadata', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          allowed: true,
          sessionId: '11111111-2222-3333-4444-555555555555',
          maxSeconds: 1200,
        },
        error: null,
      }),
    } as unknown as AppSupabaseClient

    const result = await startAudioCreditSession(mockSupabase, 'user-123')

    expect(mockSupabase.rpc).toHaveBeenCalledWith('start_audio_credit_session', { p_user_id: 'user-123' })
    expect(result.allowed).toBe(true)
    expect(result.sessionId).toBe('11111111-2222-3333-4444-555555555555')
    expect(result.maxSeconds).toBe(1200)
  })

  it('updates session heartbeat with sliding expiration', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          sessionId: '11111111-2222-3333-4444-555555555555',
          elapsed: 30,
          remaining: 1170,
        },
        error: null,
      }),
    } as unknown as AppSupabaseClient

    const result = await heartbeatAudioCreditSession(
      mockSupabase,
      '11111111-2222-3333-4444-555555555555',
      'user-123',
    )

    expect(mockSupabase.rpc).toHaveBeenCalledWith('heartbeat_audio_credit_session', {
      p_session_id: '11111111-2222-3333-4444-555555555555',
      p_user_id: 'user-123',
    })
    expect(result?.sessionId).toBe('11111111-2222-3333-4444-555555555555')
    expect(result?.elapsed).toBe(30)
    expect(result?.remaining).toBe(1170)
  })

  it('finishes an audio session and updates consumed credit count', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          audioSecondsRemaining: 1175,
          assistantMessagesRemaining: 50,
        },
        error: null,
      }),
    } as unknown as AppSupabaseClient

    const credits = await finishAudioCreditSession(
      mockSupabase,
      '11111111-2222-3333-4444-555555555555',
      25,
      'user-123',
    )

    expect(mockSupabase.rpc).toHaveBeenCalledWith('finish_audio_credit_session', {
      p_session_id: '11111111-2222-3333-4444-555555555555',
      p_seconds: 25,
      p_user_id: 'user-123',
    })
    expect(credits.audioSecondsRemaining).toBe(1175)
  })

  it('handles start rejection when user already has an unexpired active session', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          allowed: false,
          reason: 'active_session',
        },
        error: null,
      }),
    } as unknown as AppSupabaseClient

    const result = await startAudioCreditSession(mockSupabase, 'user-123')

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('active_session')
  })

  it('handles start rejection when voice credit allowance is exhausted', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          allowed: false,
          reason: 'credits_exhausted',
          audioSecondsRemaining: 0,
        },
        error: null,
      }),
    } as unknown as AppSupabaseClient

    const result = await startAudioCreditSession(mockSupabase, 'user-123')

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('credits_exhausted')
  })

  it('clamps invalid or negative credit values within bounds', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          audioSecondsRemaining: -10,
          assistantMessagesRemaining: 999,
        },
        error: null,
      }),
    } as unknown as AppSupabaseClient

    const credits = await getUsageCredits(mockSupabase, 'user-123')

    expect(credits.audioSecondsRemaining).toBe(0)
    expect(credits.assistantMessagesRemaining).toBe(50)
  })
})
