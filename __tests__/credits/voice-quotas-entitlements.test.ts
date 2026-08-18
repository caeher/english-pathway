import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_FREE_AUDIO_SECONDS,
  DEFAULT_MAX_SESSION_SECONDS,
  finishAudioCreditSession,
  getUsageCredits,
  heartbeatAudioCreditSession,
  startAudioCreditSession,
} from '@/lib/credits/usage'
import { formatVoiceRemainingLabel } from '@/lib/credits/audio-countdown'
import type { AppSupabaseClient } from '@/lib/api/context'

describe('voice quotas and entitlements architecture', () => {
  describe('free lifetime tier allocation and depletion', () => {
    it('returns default free plan quota and remaining seconds for newly registered users', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            audioSecondsRemaining: 1200,
            assistantMessagesRemaining: 50,
            hasActiveSession: false,
            activeSessionElapsed: 0,
            voiceQuota: {
              planKey: 'free',
              planName: 'Free Trial',
              isUnlimited: false,
              allowanceSeconds: 1200,
              consumedSeconds: 0,
              remainingSeconds: 1200,
              periodStart: '2026-08-18T00:00:00Z',
              periodEnd: null,
              maxSessionSeconds: 1200,
            },
          },
          error: null,
        }),
      } as unknown as AppSupabaseClient

      const credits = await getUsageCredits(mockSupabase, 'user-free-1')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_usage_credits', { p_user_id: 'user-free-1' })
      expect(credits.audioSecondsRemaining).toBe(1200)
      expect(credits.voiceQuota?.planKey).toBe('free')
      expect(credits.voiceQuota?.isUnlimited).toBe(false)
      expect(credits.voiceQuota?.remainingSeconds).toBe(1200)
      expect(credits.voiceQuota?.periodEnd).toBeNull()
    })

    it('rejects starting session when free allowance is depleted', async () => {
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

      const result = await startAudioCreditSession(mockSupabase, 'user-depleted')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('credits_exhausted')
    })
  })

  describe('monthly periodic plan renewal and rollover', () => {
    it('loads monthly quota contract with valid billing period dates', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            audioSecondsRemaining: 3600,
            assistantMessagesRemaining: 50,
            hasActiveSession: false,
            activeSessionElapsed: 0,
            voiceQuota: {
              planKey: 'monthly_standard',
              planName: 'Monthly Standard',
              isUnlimited: false,
              allowanceSeconds: 3600,
              consumedSeconds: 0,
              remainingSeconds: 3600,
              periodStart: '2026-08-01T00:00:00Z',
              periodEnd: '2026-09-01T00:00:00Z',
              maxSessionSeconds: 1200,
            },
          },
          error: null,
        }),
      } as unknown as AppSupabaseClient

      const credits = await getUsageCredits(mockSupabase, 'user-monthly-1')
      expect(credits.audioSecondsRemaining).toBe(3600)
      expect(credits.voiceQuota?.planKey).toBe('monthly_standard')
      expect(credits.voiceQuota?.allowanceSeconds).toBe(3600)
      expect(credits.voiceQuota?.periodEnd).toBe('2026-09-01T00:00:00Z')
    })

    it('caps individual realtime session to maxSessionSeconds even if period allowance is larger', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            allowed: true,
            sessionId: 'session-monthly-123',
            maxSeconds: 1200,
            isUnlimited: false,
          },
          error: null,
        }),
      } as unknown as AppSupabaseClient

      const result = await startAudioCreditSession(mockSupabase, 'user-monthly-1')
      expect(result.allowed).toBe(true)
      expect(result.sessionId).toBe('session-monthly-123')
      expect(result.maxSeconds).toBe(1200)
      expect(result.isUnlimited).toBe(false)
    })
  })

  describe('unlimited voice plan handling', () => {
    it('returns unlimited quota contract without finite numerical caps', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            audioSecondsRemaining: 999999,
            assistantMessagesRemaining: 50,
            hasActiveSession: false,
            activeSessionElapsed: 0,
            voiceQuota: {
              planKey: 'monthly_unlimited',
              planName: 'Monthly Unlimited',
              isUnlimited: true,
              allowanceSeconds: null,
              consumedSeconds: 1800,
              remainingSeconds: null,
              periodStart: '2026-08-01T00:00:00Z',
              periodEnd: '2026-09-01T00:00:00Z',
              maxSessionSeconds: 1800,
            },
          },
          error: null,
        }),
      } as unknown as AppSupabaseClient

      const credits = await getUsageCredits(mockSupabase, 'user-unlimited-1')
      expect(credits.voiceQuota?.isUnlimited).toBe(true)
      expect(credits.voiceQuota?.allowanceSeconds).toBeNull()
      expect(credits.voiceQuota?.remainingSeconds).toBeNull()
      expect(credits.voiceQuota?.maxSessionSeconds).toBe(1800)
    })

    it('grants technical session ceiling lease for unlimited plan session starts', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            allowed: true,
            sessionId: 'session-unlimited-123',
            maxSeconds: 1800,
            isUnlimited: true,
          },
          error: null,
        }),
      } as unknown as AppSupabaseClient

      const result = await startAudioCreditSession(mockSupabase, 'user-unlimited-1')
      expect(result.allowed).toBe(true)
      expect(result.sessionId).toBe('session-unlimited-123')
      expect(result.maxSeconds).toBe(1800)
      expect(result.isUnlimited).toBe(true)
    })

    it('formats label as "Unlimited voice" when inactive and countdown when active', () => {
      const inactiveLabel = formatVoiceRemainingLabel({
        active: false,
        liveRemainingSeconds: null,
        credits: {
          audioSecondsRemaining: 999999,
          voiceQuota: { isUnlimited: true },
        },
      })
      expect(inactiveLabel).toBe('Unlimited voice')

      const activeLabel = formatVoiceRemainingLabel({
        active: true,
        liveRemainingSeconds: 1750,
        credits: {
          audioSecondsRemaining: 999999,
          voiceQuota: { isUnlimited: true },
        },
      })
      expect(activeLabel).toBe('29:10 voice remaining')
    })
  })

  describe('concurrency and simultaneous session rejection', () => {
    it('rejects parallel start request when an active unexpired session exists', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            allowed: false,
            reason: 'active_session',
          },
          error: null,
        }),
      } as unknown as AppSupabaseClient

      const result = await startAudioCreditSession(mockSupabase, 'user-concurrent')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('active_session')
    })
  })

  describe('session heartbeat, finish settlement, and clamping', () => {
    it('extends lease on heartbeat with remaining countdown', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            sessionId: 'session-hb-1',
            elapsed: 60,
            remaining: 1140,
          },
          error: null,
        }),
      } as unknown as AppSupabaseClient

      const result = await heartbeatAudioCreditSession(mockSupabase, 'session-hb-1', 'user-123')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('heartbeat_audio_credit_session', {
        p_session_id: 'session-hb-1',
        p_user_id: 'user-123',
      })
      expect(result?.elapsed).toBe(60)
      expect(result?.remaining).toBe(1140)
    })

    it('settles session finish atomically and returns refreshed plan quota', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            audioSecondsRemaining: 1155,
            assistantMessagesRemaining: 50,
            hasActiveSession: false,
            activeSessionElapsed: 0,
            voiceQuota: {
              planKey: 'free',
              planName: 'Free Trial',
              isUnlimited: false,
              allowanceSeconds: 1200,
              consumedSeconds: 45,
              remainingSeconds: 1155,
              periodStart: '2026-08-18T00:00:00Z',
              periodEnd: null,
              maxSessionSeconds: 1200,
            },
          },
          error: null,
        }),
      } as unknown as AppSupabaseClient

      const result = await finishAudioCreditSession(mockSupabase, 'session-fin-1', 45, 'user-123')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('finish_audio_credit_session', {
        p_session_id: 'session-fin-1',
        p_seconds: 45,
        p_user_id: 'user-123',
      })
      expect(result.audioSecondsRemaining).toBe(1155)
      expect(result.voiceQuota?.consumedSeconds).toBe(45)
    })
  })

  describe('constants and backward compatibility', () => {
    it('defines informational constants without hardcoding them into active RPC checks', () => {
      expect(DEFAULT_FREE_AUDIO_SECONDS).toBe(1200)
      expect(DEFAULT_MAX_SESSION_SECONDS).toBe(1200)
    })
  })
})
