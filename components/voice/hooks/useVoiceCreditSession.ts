'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  calculateConsumedAudioSeconds,
  calculateRemainingAudioSeconds,
} from '@/lib/credits/audio-countdown'
import type { UsageCredits } from '@/lib/credits/usage'

type Credits = UsageCredits

export interface UseVoiceCreditSessionOptions {
  enabled: boolean
  active: boolean
  onTimeLimitReached?: () => void
}

export function useVoiceCreditSession({ enabled, active, onTimeLimitReached }: UseVoiceCreditSessionOptions) {
  const [credits, setCredits] = useState<Credits | null>(null)
  const [creditsError, setCreditsError] = useState(false)
  const [liveRemainingSeconds, setLiveRemainingSeconds] = useState<number | null>(null)

  const creditSessionIdRef = useRef<string | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const maxSecondsRef = useRef(0)
  const endTimerRef = useRef<number | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const heartbeatTimerRef = useRef<number | null>(null)
  const endingRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (endTimerRef.current !== null) {
      window.clearTimeout(endTimerRef.current)
      endTimerRef.current = null
    }
    if (heartbeatTimerRef.current !== null) {
      window.clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const updateCountdown = useCallback(() => {
    const startedAt = startedAtRef.current
    const maxSec = maxSecondsRef.current
    if (startedAt !== null && maxSec > 0) {
      setLiveRemainingSeconds(calculateRemainingAudioSeconds(startedAt, maxSec, Date.now()))
    }
  }, [])

  const loadCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/credits')
      if (!response.ok) {
        setCreditsError(true)
        return
      }
      const data = await response.json() as Credits
      setCredits(data)
      setCreditsError(false)
      setLiveRemainingSeconds(null)
    } catch {
      setCreditsError(true)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      void loadCredits()
    }
  }, [enabled, loadCredits])

  useEffect(() => {
    if (!active) {
      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      return
    }

    updateCountdown()
    const interval = window.setInterval(updateCountdown, 250)
    countdownIntervalRef.current = interval

    const handleSync = () => {
      updateCountdown()
    }

    document.addEventListener('visibilitychange', handleSync)
    window.addEventListener('focus', handleSync)

    return () => {
      window.clearInterval(interval)
      countdownIntervalRef.current = null
      document.removeEventListener('visibilitychange', handleSync)
      window.removeEventListener('focus', handleSync)
    }
  }, [active, updateCountdown])

  useEffect(() => {
    const sendCleanupBeacon = () => {
      const sessionId = creditSessionIdRef.current
      const startedAt = startedAtRef.current
      if (!sessionId || startedAt === null) return
      const seconds = calculateConsumedAudioSeconds(startedAt, maxSecondsRef.current, Date.now())
      const payload = JSON.stringify({ sessionId, seconds })
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/tutor/realtime/finish', payload)
      } else {
        fetch('/api/tutor/realtime/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    }

    const handlePageHide = () => {
      sendCleanupBeacon()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && creditSessionIdRef.current) {
        const sessionId = creditSessionIdRef.current
        const payload = JSON.stringify({ sessionId })
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/tutor/realtime/heartbeat', payload)
        } else {
          fetch('/api/tutor/realtime/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {})
        }
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const beginCreditSession = useCallback((sessionId: string, maxSeconds: number) => {
    creditSessionIdRef.current = sessionId
    maxSecondsRef.current = maxSeconds
    startedAtRef.current = Date.now()
    setLiveRemainingSeconds(maxSeconds)

    clearTimers()
    heartbeatTimerRef.current = window.setInterval(() => {
      const currentSessionId = creditSessionIdRef.current
      if (!currentSessionId) return
      fetch('/api/tutor/realtime/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId }),
        keepalive: true,
      }).catch(() => {})
    }, 30_000)

    endTimerRef.current = window.setTimeout(() => {
      onTimeLimitReached?.()
    }, maxSeconds * 1_000)
  }, [clearTimers, onTimeLimitReached])

  const startCreditSession = useCallback(async () => {
    const response = await fetch('/api/tutor/credits/start', { method: 'POST' })
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null
      throw new Error(payload?.error ?? 'Your voice lesson credits have been used.')
    }
    const data = await response.json() as { sessionId: string; maxSeconds: number }
    if (!data.sessionId || !Number.isFinite(data.maxSeconds) || data.maxSeconds < 1) {
      throw new Error('Voice credit session was not created.')
    }

    beginCreditSession(data.sessionId, data.maxSeconds)
    return data
  }, [beginCreditSession])

  const finishCreditSession = useCallback(async () => {
    if (endingRef.current) return
    endingRef.current = true
    clearTimers()

    const startedAt = startedAtRef.current
    const seconds = startedAt !== null
      ? calculateConsumedAudioSeconds(startedAt, maxSecondsRef.current, Date.now())
      : 0
    const creditSessionId = creditSessionIdRef.current

    startedAtRef.current = null
    creditSessionIdRef.current = null
    maxSecondsRef.current = 0
    setLiveRemainingSeconds(null)

    if (creditSessionId) {
      try {
        const response = await fetch('/api/tutor/realtime/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: creditSessionId, seconds }),
          keepalive: true,
        })
        if (response.ok) {
          const reconciled = await response.json() as Credits
          setCredits(reconciled)
          setCreditsError(false)
        } else {
          await loadCredits()
        }
      } catch {
        await loadCredits().catch(() => {})
      }
    } else {
      await loadCredits().catch(() => {})
    }

    endingRef.current = false
    return seconds
  }, [clearTimers, loadCredits])

  const hasCreditsAvailable = credits !== null
    && !creditsError
    && (credits.voiceQuota?.isUnlimited === true || credits.audioSecondsRemaining > 0)

  const isStartDisabled = !enabled
    || creditsError
    || credits === null
    || (!credits.voiceQuota?.isUnlimited && credits.audioSecondsRemaining <= 0)

  return {
    credits,
    creditsError,
    liveRemainingSeconds,
    creditSessionIdRef,
    startedAtRef,
    maxSecondsRef,
    loadCredits,
    beginCreditSession,
    startCreditSession,
    finishCreditSession,
    hasCreditsAvailable,
    isStartDisabled,
    clearTimers,
  }
}
