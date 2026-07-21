type RateLimitPolicy = {
  limit: number
  windowMs: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export const expensiveRoutePolicies: Record<string, RateLimitPolicy> = {
  '/api/english-assistant': { limit: 12, windowMs: 60_000 },
  '/api/tutor/context': { limit: 30, windowMs: 60_000 },
  '/api/tutor/session': { limit: 10, windowMs: 60_000 },
  '/api/onboarding/assessment': { limit: 20, windowMs: 60_000 },
  '/api/progress/activity': { limit: 60, windowMs: 60_000 },
  '/api/progress/chapter': { limit: 30, windowMs: 60_000 },
  '/api/progress/merge': { limit: 10, windowMs: 60_000 },
  '/api/engagement/session': { limit: 30, windowMs: 60_000 },
  '/api/srs': { limit: 60, windowMs: 60_000 },
  '/api/tutor/memory': { limit: 30, windowMs: 60_000 },
}

export function getRateLimitPolicy(pathname: string): RateLimitPolicy | null {
  return expensiveRoutePolicies[pathname] ?? null
}

export function getClientKey(request: Request & { headers: Headers }): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || request.headers.get('x-real-ip') || 'unknown'
}

export function consumeRateLimit(key: string, policy: RateLimitPolicy, now = Date.now()): {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
} {
  const current = buckets.get(key)
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + policy.windowMs }
    : current

  bucket.count += 1
  buckets.set(key, bucket)
  const remaining = Math.max(0, policy.limit - bucket.count)
  return {
    allowed: bucket.count <= policy.limit,
    remaining,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  }
}

export function resetRateLimitBuckets(): void {
  buckets.clear()
}
