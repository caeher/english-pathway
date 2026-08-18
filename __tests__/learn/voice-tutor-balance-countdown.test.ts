import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('voice tutor balance countdown and provider branding removal', () => {
  const providerCode = readFileSync(
    resolve(root, 'components/voice/OpenAiRealtimeTutorProvider.tsx'),
    'utf8',
  )

  it('removes provider branding from all learner-facing voice credit displays', () => {
    expect(providerCode).not.toContain('OpenAI realtime voice tutor ·')
    expect(providerCode).not.toContain('OpenAI realtime voice tutor')
    expect(providerCode).toContain('<p className="mt-1 text-xs text-(--text-muted)">{audioLabel}</p>')
  })

  it('initializes live countdown from server-granted allowance and derives wall-clock time', () => {
    expect(providerCode).toContain("response.headers.get('X-Audio-Credit-Max-Seconds')")
    expect(providerCode).toContain('setLiveRemainingSeconds(maxSeconds)')
    expect(providerCode).toContain('calculateRemainingAudioSeconds')
    expect(providerCode).toContain('startedAtRef.current')
  })

  it('registers visibilitychange and focus listeners to eliminate background throttling drift', () => {
    expect(providerCode).toContain("document.addEventListener('visibilitychange', handleSync)")
    expect(providerCode).toContain("window.addEventListener('focus', handleSync)")
    expect(providerCode).toContain("document.removeEventListener('visibilitychange', handleSync)")
    expect(providerCode).toContain("window.removeEventListener('focus', handleSync)")
  })

  it('reconciles UI balance with server-authoritative response on session finish and errors', () => {
    expect(providerCode).toContain('/api/tutor/realtime/finish')
    expect(providerCode).toContain('setCredits(reconciled)')
    expect(providerCode).toContain('setLiveRemainingSeconds(null)')
    expect(providerCode).toContain('loadCredits')
  })

  it('disables starting voice when balance reaches zero or credits cannot be loaded', () => {
    expect(providerCode).toContain('isStartDisabled')
    expect(providerCode).toContain('credits.audioSecondsRemaining <= 0')
    expect(providerCode).toContain('creditsError')
    expect(providerCode).toContain('disabled={isStartDisabled}')
  })

  it('displays explicit credit unavailable error state when credit load fails', () => {
    expect(providerCode).toContain('creditsError')
    expect(providerCode).toContain('setCreditsError(true)')
    expect(providerCode).toContain('Voice credits could not be loaded. Please check your connection.')
  })
})
