import type { AppSupabaseClient } from '@/lib/api/context'

export const AUDIO_CREDIT_SECONDS = 5 * 60
export const ASSISTANT_MESSAGE_CREDITS = 50

export type UsageCredits = {
  audioSecondsRemaining: number
  assistantMessagesRemaining: number
}

function toCredits(value: unknown): UsageCredits {
  const data = value as Partial<UsageCredits> | null
  return {
    audioSecondsRemaining: Math.max(0, Math.min(AUDIO_CREDIT_SECONDS, Number(data?.audioSecondsRemaining ?? AUDIO_CREDIT_SECONDS))),
    assistantMessagesRemaining: Math.max(0, Math.min(ASSISTANT_MESSAGE_CREDITS, Number(data?.assistantMessagesRemaining ?? ASSISTANT_MESSAGE_CREDITS))),
  }
}

export async function getUsageCredits(supabase: AppSupabaseClient): Promise<UsageCredits> {
  const { data, error } = await supabase.rpc('get_usage_credits')
  if (error) throw new Error(`Failed to load usage credits: ${error.message}`)
  return toCredits(data)
}

export async function consumeAssistantCredit(supabase: AppSupabaseClient) {
  const { data, error } = await supabase.rpc('consume_assistant_credit')
  if (error) throw new Error(`Failed to consume assistant credit: ${error.message}`)
  const result = data as { allowed?: boolean } | null
  return { allowed: result?.allowed === true, credits: toCredits(data) }
}

export async function startAudioCreditSession(supabase: AppSupabaseClient) {
  const { data, error } = await supabase.rpc('start_audio_credit_session')
  if (error) throw new Error(`Failed to start audio credit session: ${error.message}`)
  const result = data as { allowed?: boolean; sessionId?: string; maxSeconds?: number; reason?: string } | null
  return {
    allowed: result?.allowed === true,
    sessionId: result?.sessionId,
    maxSeconds: result?.maxSeconds,
    reason: result?.reason,
  }
}

export async function finishAudioCreditSession(supabase: AppSupabaseClient, sessionId: string, seconds: number): Promise<UsageCredits> {
  const { data, error } = await supabase.rpc('finish_audio_credit_session', { p_session_id: sessionId, p_seconds: seconds })
  if (error) throw new Error(`Failed to finish audio credit session: ${error.message}`)
  return toCredits(data)
}
