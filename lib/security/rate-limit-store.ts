import { createAdminClient } from '@/lib/supabase/admin'
import { consumeRateLimit, type RateLimitPolicy } from '@/lib/security/rate-limit'

export type RateLimitConsumeResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export interface RateLimitStore {
  consume(key: string, policy: RateLimitPolicy, now?: number): Promise<RateLimitConsumeResult>
}

export class InMemoryRateLimitStore implements RateLimitStore {
  async consume(key: string, policy: RateLimitPolicy, now = Date.now()): Promise<RateLimitConsumeResult> {
    return consumeRateLimit(key, policy, now)
  }
}

export class SupabaseRateLimitStore implements RateLimitStore {
  async consume(key: string, policy: RateLimitPolicy): Promise<RateLimitConsumeResult> {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_bucket_key: key,
      p_limit: policy.limit,
      p_window_ms: policy.windowMs,
    })

    if (error) {
      throw new Error(`Failed to consume rate limit: ${error.message}`)
    }

    const result = data as {
      allowed?: boolean
      remaining?: number
      retryAfterSeconds?: number
    } | null

    return {
      allowed: result?.allowed === true,
      remaining: Math.max(0, Number(result?.remaining ?? 0)),
      retryAfterSeconds: Math.max(1, Number(result?.retryAfterSeconds ?? 1)),
    }
  }
}

let defaultStore: RateLimitStore | null = null

export function createRateLimitStore(): RateLimitStore {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseRateLimitStore()
  }
  return new InMemoryRateLimitStore()
}

export function getRateLimitStore(): RateLimitStore {
  if (!defaultStore) {
    defaultStore = createRateLimitStore()
  }
  return defaultStore
}

export function setRateLimitStore(store: RateLimitStore): void {
  defaultStore = store
}

export function resetRateLimitStore(): void {
  defaultStore = null
}
