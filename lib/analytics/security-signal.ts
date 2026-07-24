import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { InjectionSignal } from '@/lib/security/prompt-trust'

export type SecurityInjectionSurface = 'assistant' | 'voice_tutor'

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
