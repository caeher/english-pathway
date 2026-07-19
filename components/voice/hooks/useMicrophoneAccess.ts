'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MicrophoneState } from '@/components/voice/session-types'
import { stopMediaStream } from '@/lib/audio/microphone'

interface UseMicrophoneAccessOptions {
  available: boolean
  onResult?: (result: 'unavailable' | 'granted' | 'denied' | 'error') => void
}

export function useVoiceAvailability() {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    setAvailable(Boolean(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID && navigator.mediaDevices?.getUserMedia))
  }, [])

  return available
}

export function useMicrophoneAccess({ available, onResult }: UseMicrophoneAccessOptions) {
  const [state, setState] = useState<MicrophoneState>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)

  const stop = useCallback(() => {
    setStream((current) => {
      stopMediaStream(current)
      return null
    })
    setState('idle')
  }, [])

  const check = useCallback(async () => {
    if (!available || !navigator.mediaDevices?.getUserMedia) {
      setState('unavailable')
      onResult?.('unavailable')
      return false
    }

    stop()
    setState('checking')
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(nextStream)
      setState('ready')
      onResult?.('granted')
      return true
    } catch (error) {
      const denied = error instanceof DOMException && error.name === 'NotAllowedError'
      setState(denied ? 'denied' : 'error')
      onResult?.(denied ? 'denied' : 'error')
      return false
    }
  }, [available, onResult, stop])

  useEffect(() => stop, [stop])

  return { state, stream, check, stop }
}
