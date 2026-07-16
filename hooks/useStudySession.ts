'use client'

import { useEffect, useRef, useCallback } from 'react'

const SYNC_INTERVAL_MS = 30_000
const MINUTE_MS = 60_000

export function useStudySession(enabled = true) {
  const startRef = useRef<number | null>(null)
  const accumulatedRef = useRef(0)
  const lastSyncRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const syncMinutes = useCallback(async (activityCompleted = false) => {
    const elapsed = accumulatedRef.current
    const minutes = Math.floor(elapsed / MINUTE_MS)
    if (minutes <= 0 && !activityCompleted) return

    if (minutes > 0) {
      accumulatedRef.current -= minutes * MINUTE_MS
    }

    try {
      await fetch('/api/engagement/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes, activityCompleted }),
      })
    } catch {
      // offline — keep accumulated time
      if (minutes > 0) accumulatedRef.current += minutes * MINUTE_MS
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onFocus = () => {
      if (!startRef.current) startRef.current = Date.now()
    }

    const onBlur = () => {
      if (startRef.current) {
        accumulatedRef.current += Date.now() - startRef.current
        startRef.current = null
        void syncMinutes()
      }
    }

    const tick = () => {
      if (!document.hasFocus() || !startRef.current) return
      accumulatedRef.current += Date.now() - startRef.current
      startRef.current = Date.now()

      const sinceLastSync = Date.now() - lastSyncRef.current
      if (sinceLastSync >= SYNC_INTERVAL_MS) {
        lastSyncRef.current = Date.now()
        void syncMinutes()
      }
    }

    startRef.current = Date.now()
    lastSyncRef.current = Date.now()
    intervalRef.current = setInterval(tick, 10_000)

    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)

    return () => {
      if (startRef.current) {
        accumulatedRef.current += Date.now() - startRef.current
      }
      void syncMinutes()
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }, [enabled, syncMinutes])

  const recordActivityComplete = useCallback(() => {
    void syncMinutes(true)
  }, [syncMinutes])

  return { recordActivityComplete }
}
