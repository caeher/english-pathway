import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { recordRateLimitHit, type RateLimitSurface } from '@/lib/analytics/security-signal'
import { buildRateLimitKey, fingerprintRateLimitKey } from '@/lib/security/rate-limit-keys'
import { getClientKey, getRateLimitPolicy } from '@/lib/security/rate-limit'
import { getRateLimitStore } from '@/lib/security/rate-limit-store'

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.', code: 'RATE_LIMITED' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  )
}

export async function enforceRateLimit(args: {
  request: Request
  route: string
  userId?: string | null
  supabase?: SupabaseClient<Database> | null
  surface?: RateLimitSurface
}): Promise<NextResponse | null> {
  const policy = getRateLimitPolicy(args.route)
  if (!policy) return null

  const key = await buildRateLimitKey({
    route: args.route,
    userId: args.userId,
    clientIp: getClientKey(args.request),
  })

  const result = await getRateLimitStore().consume(key, policy)
  if (result.allowed) return null

  if (args.supabase && args.surface) {
    const fingerprint = await fingerprintRateLimitKey(key)
    await recordRateLimitHit(args.supabase, args.userId ?? null, args.surface, fingerprint, args.route).catch(() => {})
  }

  return rateLimitResponse(result.retryAfterSeconds)
}
