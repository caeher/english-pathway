import type { AppSupabaseClient } from '@/lib/api/context'

export const AUDIO_CREDIT_SECONDS = 20 * 60
export const ASSISTANT_MESSAGE_CREDITS = 50

export type UsageCredits = {
  audioSecondsRemaining: number
  assistantMessagesRemaining: number
  hasActiveSession?: boolean
  activeSessionElapsed?: number
}

function toCredits(value: unknown): UsageCredits {
  const data = value as Partial<UsageCredits> | null
  return {
    audioSecondsRemaining: Math.max(0, Math.min(AUDIO_CREDIT_SECONDS, Number(data?.audioSecondsRemaining ?? AUDIO_CREDIT_SECONDS))),
    assistantMessagesRemaining: Math.max(0, Math.min(ASSISTANT_MESSAGE_CREDITS, Number(data?.assistantMessagesRemaining ?? ASSISTANT_MESSAGE_CREDITS))),
    ...(data?.hasActiveSession !== undefined ? { hasActiveSession: Boolean(data.hasActiveSession) } : {}),
    ...(data?.activeSessionElapsed !== undefined ? { activeSessionElapsed: Number(data.activeSessionElapsed) } : {}),
  }
}

export async function getUsageCredits(supabase: AppSupabaseClient, userId?: string): Promise<UsageCredits> {
  const { data, error } = await supabase.rpc('get_usage_credits', { p_user_id: userId })
  if (error) throw new Error(`Failed to load usage credits: ${error.message}`)
  return toCredits(data)
}

export async function consumeAssistantCredit(supabase: AppSupabaseClient, userId?: string) {
  const { data, error } = await supabase.rpc('consume_assistant_credit', { p_user_id: userId })
  if (error) throw new Error(`Failed to consume assistant credit: ${error.message}`)
  const result = data as { allowed?: boolean } | null
  return { allowed: result?.allowed === true, credits: toCredits(data) }
}

export async function startAudioCreditSession(supabase: AppSupabaseClient, userId?: string) {
  const { data, error } = await supabase.rpc('start_audio_credit_session', { p_user_id: userId })
  if (error) throw new Error(`Failed to start audio credit session: ${error.message}`)
  const result = data as { allowed?: boolean; sessionId?: string; maxSeconds?: number; reason?: string } | null
  return {
    allowed: result?.allowed === true,
    sessionId: result?.sessionId,
    maxSeconds: result?.maxSeconds,
    reason: result?.reason,
  }
}

export async function heartbeatAudioCreditSession(supabase: AppSupabaseClient, sessionId: string, userId?: string) {
  const { data, error } = await supabase.rpc('heartbeat_audio_credit_session', {
    p_session_id: sessionId,
    ...(userId ? { p_user_id: userId } : {})
  })
  if (error) throw new Error(`Failed to update audio credit session heartbeat: ${error.message}`)
  return data as { sessionId?: string; elapsed?: number; remaining?: number; error?: string } | null
}

export async function finishAudioCreditSession(supabase: AppSupabaseClient, sessionId: string, seconds: number, userId?: string): Promise<UsageCredits> {
  const { data, error } = await supabase.rpc('finish_audio_credit_session', {
    p_session_id: sessionId,
    p_seconds: seconds,
    ...(userId ? { p_user_id: userId } : {})
  })
  if (error) throw new Error(`Failed to finish audio credit session: ${error.message}`)
  return toCredits(data)
}
