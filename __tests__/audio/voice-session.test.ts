import { describe, expect, it } from 'vitest'
import { resolveSessionLaunch } from '@/components/voice/session-config'

describe('tutor session launch policy', () => {
  it('falls back to text when voice configuration is unavailable', () => {
    expect(resolveSessionLaunch({ textOnly: true }, 'voice')).toEqual({ ok: false, reason: 'voice_unavailable' })
    expect(resolveSessionLaunch({ textOnly: true }, 'text')).toEqual({ ok: false, reason: 'not_configured' })
  })

  it('prefers a signed URL and allows a configured text session', () => {
    expect(resolveSessionLaunch({ textOnly: false, signedUrl: 'https://example.test/session' }, 'voice')).toEqual({
      ok: true,
      textOnly: false,
      signedUrl: 'https://example.test/session',
    })
    expect(resolveSessionLaunch({ textOnly: false, agentId: 'agent-1' }, 'text')).toEqual({
      ok: true,
      textOnly: true,
      agentId: 'agent-1',
    })
  })
})
