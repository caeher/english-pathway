import { describe, expect, it, beforeEach } from 'vitest'
import { criticalJourneys, qualityBudgets } from '@/lib/quality/critical-routes'
import { securityHeaders } from '@/lib/security/headers'
import { consumeRateLimit, getRateLimitPolicy, resetRateLimitBuckets } from '@/lib/security/rate-limit'
import { isSameOriginRequest } from '@/lib/security/request'

describe('release quality gates', () => {
  beforeEach(() => resetRateLimitBuckets())

  it('covers every provider and degraded critical journey', () => {
    expect(criticalJourneys.length).toBeGreaterThanOrEqual(6)
    expect(criticalJourneys.some((journey) => journey.requiresProvider)).toBe(true)
    expect(criticalJourneys.some((journey) => !journey.requiresProvider)).toBe(true)
    expect(new Set(criticalJourneys.map((journey) => journey.id)).size).toBe(criticalJourneys.length)
  })

  it('keeps measurable performance budgets', () => {
    expect(qualityBudgets.public.lcpMs).toBeLessThanOrEqual(2500)
    expect(qualityBudgets.authenticated.lcpMs).toBeLessThanOrEqual(3000)
    expect(qualityBudgets.public.cls).toBeLessThanOrEqual(0.1)
    expect(qualityBudgets.ragRequestMs).toBeLessThanOrEqual(2500)
  })

  it('requires clickjacking, MIME, referrer, transport, and CSP protections', () => {
    const values = Object.fromEntries(securityHeaders.map((header) => [header.key, header.value]))
    expect(values['X-Frame-Options']).toBe('DENY')
    expect(values['X-Content-Type-Options']).toBe('nosniff')
    expect(values['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(values['Strict-Transport-Security']).toContain('max-age=')
    expect(values['Content-Security-Policy']).toContain("frame-ancestors 'none'")
  })

  it('rejects cross-origin state changes while allowing same-origin requests', () => {
    expect(isSameOriginRequest(new Request('https://app.example/api/tutor/context', { headers: { origin: 'https://evil.example' } }))).toBe(false)
    expect(isSameOriginRequest(new Request('https://app.example/api/tutor/context', { headers: { origin: 'https://app.example' } }))).toBe(true)
    expect(isSameOriginRequest(new Request('https://app.example/api/tutor/context'))).toBe(true)
  })

  it('allows proxied same-origin requests and trusted app URL fallback', () => {
    expect(isSameOriginRequest(new Request('http://0.0.0.0:3000/api/tutor/realtime', {
      headers: {
        origin: 'https://app.example',
        'x-forwarded-host': 'app.example',
        'x-forwarded-proto': 'https',
      },
    }))).toBe(true)

    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example'
    try {
      expect(isSameOriginRequest(new Request('http://0.0.0.0:3000/api/tutor/realtime', {
        headers: { origin: 'https://app.example' },
      }))).toBe(true)
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
    }
  })

  it('rate limits expensive tutor and assessment endpoints', () => {
    const policy = getRateLimitPolicy('/api/tutor/context')
    expect(policy).not.toBeNull()
    const first = consumeRateLimit('test-client', { limit: 2, windowMs: 60_000 }, 1_000)
    const second = consumeRateLimit('test-client', { limit: 2, windowMs: 60_000 }, 1_000)
    const third = consumeRateLimit('test-client', { limit: 2, windowMs: 60_000 }, 1_000)
    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSeconds).toBeGreaterThan(0)
  })
})
