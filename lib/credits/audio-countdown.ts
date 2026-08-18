export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export function calculateRemainingAudioSeconds(startedAt: number, maxSeconds: number, now = Date.now()): number {
  if (startedAt <= 0 || maxSeconds <= 0) return 0
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000))
  return Math.max(0, maxSeconds - elapsed)
}

export function calculateConsumedAudioSeconds(startedAt: number, maxSeconds: number, now = Date.now()): number {
  if (startedAt <= 0 || maxSeconds <= 0) return 0
  const elapsed = Math.max(0, Math.ceil((now - startedAt) / 1000))
  return Math.min(maxSeconds, elapsed)
}

export interface VoiceRemainingLabelOptions {
  active: boolean
  liveRemainingSeconds: number | null
  credits: { audioSecondsRemaining: number } | null
  creditsError?: boolean
}

export function formatVoiceRemainingLabel({
  active,
  liveRemainingSeconds,
  credits,
  creditsError = false,
}: VoiceRemainingLabelOptions): string {
  if (creditsError) {
    return 'Voice credits unavailable'
  }

  if (active && liveRemainingSeconds !== null) {
    return `${formatDuration(liveRemainingSeconds)} voice remaining`
  }

  if (credits !== null && credits !== undefined) {
    return `${formatDuration(credits.audioSecondsRemaining)} voice remaining`
  }

  return 'Voice credits loading…'
}
