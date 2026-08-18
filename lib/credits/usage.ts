import type { AppSupabaseClient } from '@/lib/api/context'

export const DEFAULT_FREE_AUDIO_SECONDS = 20 * 60
export const DEFAULT_MAX_SESSION_SECONDS = 20 * 60
/** @deprecated Use plan-derived quota or DEFAULT_FREE_AUDIO_SECONDS */
export const AUDIO_CREDIT_SECONDS = DEFAULT_FREE_AUDIO_SECONDS
export const ASSISTANT_MESSAGE_CREDITS = 50

export type VoiceQuotaInfo = {
  planKey: string
  planName: string
  isUnlimited: boolean
  allowanceSeconds: number | null
  consumedSeconds: number
  remainingSeconds: number | null
  periodStart: string
  periodEnd: string | null
  maxSessionSeconds: number
}

export type UsageCredits = {
  audioSecondsRemaining: number
  assistantMessagesRemaining: number
  hasActiveSession?: boolean
  activeSessionElapsed?: number
  voiceQuota?: VoiceQuotaInfo
}

export type StartAudioSessionResult = {
  allowed: boolean
  sessionId?: string
  maxSeconds?: number
  isUnlimited?: boolean
  reason?: string
}

function parseVoiceQuota(value: unknown): VoiceQuotaInfo | undefined {
  if (!value || typeof value !== 'object') return undefined
  const data = value as Partial<VoiceQuotaInfo>
  if (!data.planKey || !data.planName) return undefined
  return {
    planKey: String(data.planKey),
    planName: String(data.planName),
    isUnlimited: Boolean(data.isUnlimited),
    allowanceSeconds: data.allowanceSeconds !== null && data.allowanceSeconds !== undefined ? Number(data.allowanceSeconds) : null,
    consumedSeconds: Math.max(0, Number(data.consumedSeconds ?? 0)),
    remainingSeconds: data.remainingSeconds !== null && data.remainingSeconds !== undefined ? Math.max(0, Number(data.remainingSeconds)) : null,
    periodStart: String(data.periodStart ?? new Date().toISOString()),
    periodEnd: data.periodEnd ? String(data.periodEnd) : null,
    maxSessionSeconds: Math.max(1, Number(data.maxSessionSeconds ?? DEFAULT_MAX_SESSION_SECONDS)),
  }
}

function toCredits(value: unknown): UsageCredits {
  const data = value as (Partial<UsageCredits> & { voiceQuota?: unknown }) | null
  const parsedQuota = parseVoiceQuota(data?.voiceQuota)
  const defaultRemaining = parsedQuota?.isUnlimited
    ? 999999
    : (parsedQuota?.remainingSeconds ?? DEFAULT_FREE_AUDIO_SECONDS)

  const rawRemaining = data?.audioSecondsRemaining !== undefined
    ? Number(data.audioSecondsRemaining)
    : defaultRemaining

  return {
    audioSecondsRemaining: Math.max(0, rawRemaining),
    assistantMessagesRemaining: Math.max(0, Math.min(ASSISTANT_MESSAGE_CREDITS, Number(data?.assistantMessagesRemaining ?? ASSISTANT_MESSAGE_CREDITS))),
    ...(data?.hasActiveSession !== undefined ? { hasActiveSession: Boolean(data.hasActiveSession) } : {}),
    ...(data?.activeSessionElapsed !== undefined ? { activeSessionElapsed: Number(data.activeSessionElapsed) } : {}),
    ...(parsedQuota ? { voiceQuota: parsedQuota } : {}),
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

export async function startAudioCreditSession(supabase: AppSupabaseClient, userId?: string): Promise<StartAudioSessionResult> {
  const { data, error } = await supabase.rpc('start_audio_credit_session', { p_user_id: userId })
  if (error) throw new Error(`Failed to start audio credit session: ${error.message}`)
  const result = data as { allowed?: boolean; sessionId?: string; maxSeconds?: number; isUnlimited?: boolean; reason?: string } | null
  return {
    allowed: result?.allowed === true,
    sessionId: result?.sessionId,
    maxSeconds: result?.maxSeconds,
    isUnlimited: result?.isUnlimited,
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
