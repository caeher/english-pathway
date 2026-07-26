import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildRateLimitKey } from '@/lib/security/rate-limit-keys'
import { consumeRateLimit, getRateLimitPolicy, resetRateLimitBuckets } from '@/lib/security/rate-limit'
import { rateLimitResponse } from '@/lib/security/enforce-rate-limit'
import {
  InMemoryRateLimitStore,
  isMissingRateLimitRpc,
  resetRateLimitStore,
  setRateLimitStore,
  SupabaseRateLimitStore,
} from '@/lib/security/rate-limit-store'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

describe('durable rate limiting', () => {
  beforeEach(() => {
    resetRateLimitBuckets()
    resetRateLimitStore()
    setRateLimitStore(new InMemoryRateLimitStore())
  })

  it('shares limits across store instances for the same identity', async () => {
    const storeA = new InMemoryRateLimitStore()
    const storeB = new InMemoryRateLimitStore()
    const policy = { limit: 2, windowMs: 60_000 }
    const key = await buildRateLimitKey({
      route: '/api/english-assistant',
      userId: 'user-123',
      clientIp: '203.0.113.1',
    })

    await storeA.consume(key, policy, 1_000)
    await storeA.consume(key, policy, 1_000)
    const blocked = await storeB.consume(key, policy, 1_000)

    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('falls back to IP keys when no user identity is available', async () => {
    const key = await buildRateLimitKey({
      route: '/api/tutor/context',
      clientIp: '198.51.100.4',
    })

    expect(key).toBe('ip:198.51.100.4:/api/tutor/context')
  })

  it('uses hashed user keys when identity is available', async () => {
    const key = await buildRateLimitKey({
      route: '/api/tutor/realtime',
      userId: 'user-abc',
      clientIp: '198.51.100.4',
    })

    expect(key.startsWith('user:')).toBe(true)
    expect(key.endsWith(':/api/tutor/realtime')).toBe(true)
    expect(key).not.toContain('user-abc')
  })

  it('rejects excess requests after the window limit is reached', () => {
    const policy = { limit: 2, windowMs: 60_000 }
    const first = consumeRateLimit('shared-key', policy, 1_000)
    const second = consumeRateLimit('shared-key', policy, 1_000)
    const third = consumeRateLimit('shared-key', policy, 1_000)

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('defines policies for chat and realtime tutor endpoints', () => {
    expect(getRateLimitPolicy('/api/english-assistant')).toEqual({ limit: 12, windowMs: 60_000 })
    expect(getRateLimitPolicy('/api/tutor/realtime')).toEqual({ limit: 6, windowMs: 60_000 })
    expect(getRateLimitPolicy('/api/tutor/realtime/finish')).toEqual({ limit: 20, windowMs: 60_000 })
  })

  it('returns a consistent 429 response with Retry-After', async () => {
    const response = rateLimitResponse(42)
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
    await expect(response.json()).resolves.toEqual({
      error: 'Too many requests. Please try again shortly.',
      code: 'RATE_LIMITED',
    })
  })

  it('detects missing durable rate limit RPC errors', () => {
    expect(isMissingRateLimitRpc({
      code: 'PGRST202',
      message: 'Could not find the function public.consume_rate_limit(p_bucket_key, p_limit, p_window_ms) in the schema cache',
    })).toBe(true)
    expect(isMissingRateLimitRpc({ message: 'permission denied' })).toBe(false)
  })

  it('falls back to in-memory limits when the durable RPC is unavailable', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(createAdminClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST202',
          message: 'Could not find the function public.consume_rate_limit(p_bucket_key, p_limit, p_window_ms) in the schema cache',
        },
      }),
    } as never)

    const store = new SupabaseRateLimitStore()
    const policy = { limit: 1, windowMs: 60_000 }
    const key = 'ip:203.0.113.1:/api/english-assistant'

    const first = await store.consume(key, policy, 1_000)
    const second = await store.consume(key, policy, 1_000)

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(false)
  })
})
