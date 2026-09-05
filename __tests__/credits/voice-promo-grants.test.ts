import { describe, expect, it, vi } from 'vitest'
import { getUsageCredits, grantActiveRegisteredPromos } from '@/lib/credits/usage'
import { isRegisteredSep2026PromoActive, REGISTERED_SEP_2026_PROMO } from '@/lib/credits/promos'
import type { AppSupabaseClient } from '@/lib/api/context'

describe('voice promo grants', () => {
  it('exposes registered Sep 2026 promo constants', () => {
    expect(REGISTERED_SEP_2026_PROMO.key).toBe('registered_sep_2026')
    expect(REGISTERED_SEP_2026_PROMO.grantedSeconds).toBe(7200)
  })

  it('detects whether the Sep 2026 promo is still active', () => {
    expect(isRegisteredSep2026PromoActive(Date.parse('2026-09-15T00:00:00Z'))).toBe(true)
    expect(isRegisteredSep2026PromoActive(Date.parse('2026-10-01T00:00:00Z'))).toBe(false)
  })

  it('parses promo fields from get_usage_credits contract', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          audioSecondsRemaining: 8400,
          assistantMessagesRemaining: 50,
          voiceQuota: {
            planKey: 'free',
            planName: 'Free Trial',
            isUnlimited: false,
            allowanceSeconds: 1200,
            consumedSeconds: 0,
            remainingSeconds: 1200,
            promoRemainingSeconds: 7200,
            promoExpiresAt: '2026-10-01T00:00:00.000Z',
            periodStart: '2026-08-18T00:00:00Z',
            periodEnd: null,
            maxSessionSeconds: 1200,
          },
        },
        error: null,
      }),
    } as unknown as AppSupabaseClient

    const credits = await getUsageCredits(mockSupabase, 'user-promo-1')
    expect(credits.audioSecondsRemaining).toBe(8400)
    expect(credits.voiceQuota?.promoRemainingSeconds).toBe(7200)
    expect(credits.voiceQuota?.promoExpiresAt).toBe('2026-10-01T00:00:00.000Z')
  })

  it('calls grant_active_registered_promos RPC', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as unknown as AppSupabaseClient

    await grantActiveRegisteredPromos(mockSupabase, 'user-new-1')
    expect(mockSupabase.rpc).toHaveBeenCalledWith('grant_active_registered_promos', { p_user_id: 'user-new-1' })
  })
})
