import type { SessionConfig, SessionMode } from './session-types'

export type SessionLaunch =
  | { ok: false; reason: 'voice_unavailable' | 'not_configured' }
  | { ok: true; textOnly: boolean; signedUrl?: string; agentId?: string }

export function resolveSessionLaunch(config: SessionConfig, mode: SessionMode): SessionLaunch {
  if (config.textOnly && mode === 'voice') return { ok: false, reason: 'voice_unavailable' }
  if (!config.signedUrl && !config.agentId) return { ok: false, reason: 'not_configured' }
  return {
    ok: true,
    textOnly: mode === 'text' || config.textOnly,
    ...(config.signedUrl ? { signedUrl: config.signedUrl } : { agentId: config.agentId }),
  }
}
