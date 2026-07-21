'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useConversation } from '@elevenlabs/react'
import { trackEvent } from '@/lib/analytics/events'
import type { SessionConfig, SessionMode, SessionOrchestration } from '@/components/voice/session-types'
import { resolveSessionLaunch } from '@/components/voice/session-config'

interface UseTutorSessionOptions {
  mode: SessionMode
  onCheckMicrophone: () => Promise<boolean>
  onSessionStarted: (sessionId: string, orchestration?: SessionOrchestration) => void
  onSessionEnded: () => void
}

export function useTutorSession({ mode, onCheckMicrophone, onSessionStarted, onSessionEnded }: UseTutorSessionOptions) {
  const { startSession, endSession, status, isMuted, setMuted, sendUserMessage } = useConversation()
  const [error, setError] = useState<string | null>(null)
  const sessionStartedAt = useRef<number | null>(null)
  const active = status === 'connected'
  const connecting = status === 'connecting'

  useEffect(() => {
    if (active && sessionStartedAt.current === null) {
      sessionStartedAt.current = Date.now()
      trackEvent('learn_session_start', { mode })
    }
    if (status === 'disconnected' && sessionStartedAt.current !== null) {
      trackEvent('learn_session_end', { mode, duration_seconds: Math.round((Date.now() - sessionStartedAt.current) / 1000) })
      sessionStartedAt.current = null
      onSessionEnded()
    }
  }, [active, mode, onSessionEnded, status])

  const start = useCallback(async () => {
    setError(null)
    if (mode === 'voice' && !(await onCheckMicrophone())) return false

    try {
      const response = await fetch('/api/tutor/session')
      if (!response.ok) throw new Error('session_config')
      const config = await response.json() as SessionConfig
      const launch = resolveSessionLaunch(config, mode)
      if (!launch.ok && launch.reason === 'voice_unavailable') {
        setError('Voice is not configured for this tutor yet. Choose text mode to continue.')
        trackEvent('learn_session_error', { mode, reason: 'voice_unavailable' })
        return false
      }
      if (!launch.ok) {
        setError('The tutor is not configured yet. Please choose another time or contact support.')
        trackEvent('learn_session_error', { mode, reason: 'not_configured' })
        return false
      }

      onSessionStarted(config.orchestration?.sessionId ?? crypto.randomUUID(), config.orchestration)
      if (launch.signedUrl) startSession({ signedUrl: launch.signedUrl, textOnly: launch.textOnly })
      else if (launch.agentId) startSession({ agentId: launch.agentId, textOnly: launch.textOnly })
      return true
    } catch {
      setError('The tutor is unavailable right now. You can try text mode again later.')
      trackEvent('learn_session_error', { mode, reason: 'session_config' })
      return false
    }
  }, [mode, onCheckMicrophone, onSessionStarted, startSession])

  const end = useCallback(() => endSession(), [endSession])

  return {
    active,
    connecting,
    status,
    error,
    clearError: () => setError(null),
    isMuted,
    setMuted,
    sendUserMessage,
    start,
    end,
  }
}
