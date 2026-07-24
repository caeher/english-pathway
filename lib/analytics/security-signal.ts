import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { InjectionSignal } from '@/lib/security/prompt-trust'

export type SecurityInjectionSurface = 'assistant' | 'voice_tutor'
export type RateLimitSurface = 'assistant' | 'realtime'

export async function recordSecurityInjectionSignal(
  supabase: SupabaseClient<Database>,
  userId: string | null,
  surface: SecurityInjectionSurface,
  signal: InjectionSignal,
): Promise<void> {
  if (signal.category === 'none') return

  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: 'security_injection_signal',
    properties: {
      surface,
      category: signal.category,
      fingerprint: signal.fingerprint,
    },
  })
}

export async function recordRateLimitHit(
  supabase: SupabaseClient<Database>,
  userId: string | null,
  surface: RateLimitSurface,
  fingerprint: string,
  route: string,
): Promise<void> {
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: 'security_rate_limit_hit',
    properties: {
      surface,
      fingerprint,
      route,
    },
  })
}
