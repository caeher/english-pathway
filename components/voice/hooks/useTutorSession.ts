'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useConversation } from '@elevenlabs/react'
import { trackEvent } from '@/lib/analytics/events'
import type { SessionConfig, SessionMode, SessionOrchestration } from '@/components/voice/session-types'
import { resolveSessionLaunch } from '@/components/voice/session-config'
import { useVoiceCreditSession } from '@/components/voice/hooks/useVoiceCreditSession'

interface UseTutorSessionOptions {
  mode: SessionMode
  onCheckMicrophone: () => Promise<boolean>
  onSessionStarted: (sessionId: string, orchestration?: SessionOrchestration) => void
  onSessionEnded: () => void
}

export function useTutorSession({ mode, onCheckMicrophone, onSessionStarted, onSessionEnded }: UseTutorSessionOptions) {
  const isExplicitEndRef = useRef(false)
  const sessionStartedAt = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const endingRef = useRef(false)
  const endRef = useRef<() => void>(() => {})

  const { startSession, endSession, status, isMuted, setMuted, sendUserMessage, isSpeaking } = useConversation({
    onError: (err: unknown) => {
      const message = typeof err === 'string'
        ? err
        : err instanceof Error
          ? err.message
          : 'The tutor connection encountered an error. You can restart the lesson.'
      setError(message)
      trackEvent('learn_session_error', { mode, reason: 'provider_error' })
    },
    onDisconnect: () => {
      if (!isExplicitEndRef.current && sessionStartedAt.current !== null) {
        setError('The tutor disconnected unexpectedly. You can reconnect to continue.')
        trackEvent('learn_session_error', { mode, reason: 'unexpected_disconnect' })
      }
    },
  })

  const active = status === 'connected'
  const connecting = status === 'connecting'

  const voiceCredits = useVoiceCreditSession({
    enabled: mode === 'voice',
    active: mode === 'voice' && active,
    onTimeLimitReached: () => {
      setError('Your voice session has reached its time limit.')
      endRef.current()
    },
  })

  const end = useCallback(() => {
    isExplicitEndRef.current = true
    endSession()
  }, [endSession])

  useEffect(() => {
    endRef.current = end
  }, [end])

  const { finishCreditSession } = voiceCredits

  useEffect(() => {
    if (active && sessionStartedAt.current === null) {
      sessionStartedAt.current = Date.now()
      trackEvent('learn_session_start', { mode, provider: 'elevenlabs' })
    }
    if (status === 'disconnected' && sessionStartedAt.current !== null) {
      const durationSeconds = Math.round((Date.now() - sessionStartedAt.current) / 1000)
      trackEvent('learn_session_end', { mode, duration_seconds: durationSeconds, provider: 'elevenlabs' })
      sessionStartedAt.current = null
      if (mode === 'voice' && !endingRef.current) {
        endingRef.current = true
        void finishCreditSession().finally(() => {
          endingRef.current = false
          onSessionEnded()
        })
      } else {
        onSessionEnded()
      }
    }
  }, [active, finishCreditSession, mode, onSessionEnded, status])

  const start = useCallback(async () => {
    setError(null)
    isExplicitEndRef.current = false
    if (mode === 'voice' && !(await onCheckMicrophone())) return false

    if (mode === 'voice' && voiceCredits.isStartDisabled) {
      setError('Your voice lesson credits have been used.')
      trackEvent('learn_session_error', { mode, reason: 'credits_exhausted' })
      return false
    }

    try {
      if (mode === 'voice') {
        await voiceCredits.startCreditSession()
      }

      const response = await fetch(`/api/tutor/session?mode=${mode}`)
      if (!response.ok) {
        if (mode === 'voice') {
          await voiceCredits.finishCreditSession()
        }
        const payload = await response.json().catch(() => null) as { error?: string } | null
        if (response.status === 429) {
          setError(payload?.error ?? 'Your voice lesson credits have been used.')
          trackEvent('learn_session_error', { mode, reason: 'credits_exhausted' })
          return false
        }
        throw new Error('session_config')
      }
      const config = await response.json() as SessionConfig
      const launch = resolveSessionLaunch(config, mode)
      if (!launch.ok && launch.reason === 'voice_unavailable') {
        if (mode === 'voice') {
          await voiceCredits.finishCreditSession()
        }
        setError('Voice is not configured for this tutor yet. Choose text mode to continue.')
        trackEvent('learn_session_error', { mode, reason: 'voice_unavailable' })
        return false
      }
      if (!launch.ok) {
        if (mode === 'voice') {
          await voiceCredits.finishCreditSession()
        }
        setError('The tutor is not configured yet. Please choose another time or contact support.')
        trackEvent('learn_session_error', { mode, reason: 'not_configured' })
        return false
      }

      onSessionStarted(config.orchestration?.sessionId ?? crypto.randomUUID(), config.orchestration)
      if (launch.signedUrl) startSession({ signedUrl: launch.signedUrl, textOnly: launch.textOnly })
      else if (launch.agentId) startSession({ agentId: launch.agentId, textOnly: launch.textOnly })
      return true
    } catch (caughtError) {
      if (mode === 'voice') {
        await voiceCredits.finishCreditSession().catch(() => {})
      }
      const message = caughtError instanceof Error ? caughtError.message : 'The tutor is unavailable right now. You can try text mode again later.'
      setError(message)
      trackEvent('learn_session_error', { mode, reason: 'session_config' })
      return false
    }
  }, [mode, onCheckMicrophone, onSessionStarted, startSession, voiceCredits])

  return {
    active,
    connecting,
    status,
    error,
    clearError: () => setError(null),
    isMuted,
    setMuted,
    isSpeaking,
    sendUserMessage,
    start,
    end,
    voiceCredits: mode === 'voice' ? voiceCredits : null,
  }
}
