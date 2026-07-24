import type { AppSupabaseClient } from '@/lib/api/context'

export async function hasActiveRealtimeSession(supabase: AppSupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('audio_credit_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Failed to check realtime concurrency: ${error.message}`)
  return data !== null
}
