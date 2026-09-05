'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react'
import MicrophoneVisualizer from './MicrophoneVisualizer'
import LearnSessionLayout from '@/components/learn/LearnSessionLayout'
import { Button, InlineError, Surface } from '@/components/ui'
import { trackEvent } from '@/lib/analytics/events'
import { useTutorActivityActions } from './hooks/useTutorActivityActions'
import { useVoiceCreditSession } from './hooks/useVoiceCreditSession'
import { executeTutorTool } from '@/lib/learn/execute-tutor-tool'
import { buildOrchestrationMessage } from '@/lib/tutor/send-orchestration'
import { learnSessionActions } from '@/stores/useLearnSessionStore'
import type { SessionMode, SessionOrchestration } from './session-types'
import { formatVoiceRemainingLabel } from '@/lib/credits/audio-countdown'

type RealtimeEvent = {
  type?: string
  name?: string
  call_id?: string
  arguments?: string
  response?: {
    output?: Array<{
      type?: string
      name?: string
      call_id?: string
      arguments?: string
    }>
  }
}

export default function OpenAiRealtimeTutorProvider() {
  const mode: SessionMode = 'voice'
  const [active, setActive] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const endingRef = useRef(false)
  const isExplicitEndRef = useRef(false)
  const processedCallIdsRef = useRef<Set<string>>(new Set())
  const endRef = useRef<() => Promise<void>>(async () => {})

  const voiceCredits = useVoiceCreditSession({
    enabled: true,
    active,
    onTimeLimitReached: () => {
      setError('Your voice session has reached its time limit.')
      void endRef.current()
    },
  })

  useEffect(() => {
    sessionStorage.removeItem('ep-session-plan')
  }, [])

  useEffect(() => {
    setVoiceSupported(Boolean(navigator.mediaDevices?.getUserMedia))
  }, [])

  const sendUserMessage = useCallback((text: string) => {
    const channel = channelRef.current
    if (!channel || channel.readyState !== 'open') return false
    channel.send(JSON.stringify({
      type: 'conversation.item.create',
      item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
    }))
    channel.send(JSON.stringify({ type: 'response.create' }))
    return true
  }, [])

  const handleFunctionCall = useCallback(async (name: string, callId: string, rawArguments: string | undefined) => {
    if (processedCallIdsRef.current.has(callId)) return
    processedCallIdsRef.current.add(callId)

    const channel = channelRef.current
    let argumentsValue: unknown = {}
    try {
      argumentsValue = rawArguments ? JSON.parse(rawArguments) : {}
    } catch {
      // Invalid tool arguments are rejected by the executor.
    }

    const output = await executeTutorTool(name, argumentsValue)
    if (!channel || channel.readyState !== 'open') return
    channel.send(JSON.stringify({
      type: 'conversation.item.create',
      item: { type: 'function_call_output', call_id: callId, output },
    }))
    channel.send(JSON.stringify({ type: 'response.create' }))
  }, [])

  const { onActivityOutcome, onActivityComplete, onActivityDifficult, onQuestionAnswered, flushPendingMessages } = useTutorActivityActions(sendUserMessage)

  const handleActivityComplete = useCallback((result: Parameters<typeof onActivityComplete>[0]) => {
    onActivityComplete(result)
  }, [onActivityComplete])

  const end = useCallback(async () => {
    if (endingRef.current) return
    endingRef.current = true
    voiceCredits.clearTimers()

    pcRef.current?.close()
    pcRef.current = null
    channelRef.current = null
    processedCallIdsRef.current.clear()
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.srcObject = null
    setStream((current) => { current?.getTracks().forEach((track) => track.stop()); return null })
    setActive(false)
    setConnecting(false)
    setMuted(false)

    const seconds = await voiceCredits.finishCreditSession()
    if (seconds) {
      trackEvent('learn_session_end', { mode, duration_seconds: seconds, provider: 'openai' })
    }
    endingRef.current = false
  }, [mode, voiceCredits])

  useEffect(() => {
    endRef.current = end
  }, [end])

  useEffect(() => () => { void end() }, [end])

  const start = useCallback(async () => {
    setError(null)
    isExplicitEndRef.current = false
    setConnecting(true)
    processedCallIdsRef.current.clear()
    try {
      const pc = new RTCPeerConnection()
      pcRef.current = pc
      const audio = document.createElement('audio')
      audio.autoplay = true
      audioRef.current = audio
      pc.ontrack = (event) => { audio.srcObject = event.streams[0] }
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          if (!isExplicitEndRef.current && voiceCredits.startedAtRef.current !== null) {
            setError('The voice connection was lost. Please restart the lesson.')
            trackEvent('learn_session_error', { mode, provider: 'openai', reason: 'connection_lost' })
          }
          void end()
        }
      }

      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
      setStream(microphone)
      microphone.getTracks().forEach((track) => pc.addTrack(track, microphone))

      const channel = pc.createDataChannel('oai-events')
      channelRef.current = channel
      channel.onmessage = (event) => {
        const payload = (() => {
          try { return JSON.parse(String(event.data)) as RealtimeEvent } catch { return null }
        })()
        if (!payload?.type) return

        if (payload.type === 'response.function_call_arguments.done' && payload.name && payload.call_id) {
          void handleFunctionCall(payload.name, payload.call_id, payload.arguments)
          return
        }

        if (payload.type === 'response.done' && Array.isArray(payload.response?.output)) {
          for (const item of payload.response.output) {
            if (item.type === 'function_call' && item.name && item.call_id) {
              void handleFunctionCall(item.name, item.call_id, item.arguments)
            }
          }
        }
      }
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      const response = await fetch('/api/tutor/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(payload?.error ?? 'Voice tutor is unavailable.')
      }
      const creditSessionId = response.headers.get('X-Audio-Credit-Session')
      const maxSeconds = Number(response.headers.get('X-Audio-Credit-Max-Seconds'))
      if (!creditSessionId || !Number.isFinite(maxSeconds) || maxSeconds < 1) throw new Error('Voice credit session was not created.')

      const orchestrationHeader = response.headers.get('X-Tutor-Orchestration')
      let orchestration: SessionOrchestration | undefined = undefined
      if (orchestrationHeader) {
        try {
          orchestration = JSON.parse(decodeURIComponent(orchestrationHeader)) as SessionOrchestration
          if (orchestration?.learner) {
            learnSessionActions.setLearnerProfile({
              level: orchestration.learner.level ?? null,
              nativeLanguage: orchestration.learner.nativeLanguage ?? null,
              nativeLanguageLabel: orchestration.learner.nativeLanguageLabel ?? null,
              fullName: orchestration.learner.fullName ?? null,
            })
          }
        } catch {
          // Fall back to default start directive if header decoding fails
        }
      }
      const bootstrapMessage = buildOrchestrationMessage(orchestration) ?? 'Start the lesson now. Greet the learner and lead with the next appropriate English lesson; do not wait for the learner to speak first.'

      await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() })
      voiceCredits.beginCreditSession(creditSessionId, maxSeconds)
      setActive(true)
      trackEvent('learn_session_start', { mode, provider: 'openai' })
      channel.onopen = () => {
        flushPendingMessages()
        sendUserMessage(bootstrapMessage)
      }
    } catch (caughtError) {
      if (voiceCredits.creditSessionIdRef.current) await end()
      else {
        pcRef.current?.close()
        pcRef.current = null
        setStream((current) => { current?.getTracks().forEach((track) => track.stop()); return null })
      }
      setError(caughtError instanceof Error ? caughtError.message : 'Voice tutor is unavailable.')
      trackEvent('learn_session_error', { mode, provider: 'openai' })
    } finally {
      setConnecting(false)
    }
  }, [end, flushPendingMessages, handleFunctionCall, mode, sendUserMessage, voiceCredits])

  const toggleMuted = () => {
    stream?.getAudioTracks().forEach((track) => { track.enabled = muted })
    setMuted((current) => !current)
  }

  const audioLabel = formatVoiceRemainingLabel({
    active,
    liveRemainingSeconds: voiceCredits.liveRemainingSeconds,
    credits: voiceCredits.credits,
    creditsError: voiceCredits.creditsError,
  })

  const isStartDisabled = connecting || !voiceSupported || voiceCredits.isStartDisabled

  return <LearnSessionLayout
    sessionMode={mode}
    tutorActive={active}
    tutorConnecting={connecting}
    showEngagement={false}
    tutorSlot={<div className="flex h-full min-h-0 flex-col">
      <div className="hidden shrink-0 border-b border-(--border-primary) p-3 lg:block">
        <h1 className="font-display text-lg font-black text-(--text-primary)">AI English Tutor</h1>
        <p className="mt-1 text-xs text-(--text-muted)">{audioLabel}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6 lg:gap-3 lg:overflow-hidden lg:p-4">
        {!active && <>
          <div className="flex flex-col gap-3 lg:hidden">
            {error && <InlineError message={error} onRetry={() => void start()} />}
            {voiceCredits.creditsError && !error && <InlineError message="Voice credits could not be loaded. Please check your connection." onRetry={() => void voiceCredits.loadCredits()} />}
            <Button type="button" onClick={() => void start()} disabled={isStartDisabled} className="w-full min-h-[44px]">{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}{connecting ? 'Connecting…' : 'Start voice lesson'}</Button>
          </div>
          <Surface as="section" padding="md" className="hidden sm:p-5 lg:block">
            <p className="text-xs font-bold uppercase tracking-wide text-(--accent)">Before you begin</p><h2 className="mt-1 font-display text-xl font-black text-(--text-primary)">Start a voice lesson</h2>
            <div className="mt-4 rounded-xl border border-(--accent) bg-(--accent-soft) p-4"><span className="flex items-center gap-2 font-bold text-(--text-primary)"><Volume2 className="h-4 w-4 text-(--accent)" />Voice</span><span className="mt-1 block text-xs text-(--text-secondary)">Speak and listen with your tutor. The English helper remains available for text chat.</span></div>
            {error && <InlineError message={error} onRetry={() => void start()} className="mt-4" />}
            {voiceCredits.creditsError && !error && <InlineError message="Voice credits could not be loaded. Please check your connection." onRetry={() => void voiceCredits.loadCredits()} className="mt-4" />}
            <Button type="button" onClick={() => void start()} disabled={isStartDisabled} className="mt-5 w-full sm:w-auto">{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}{connecting ? 'Connecting…' : 'Start voice lesson'}</Button>
          </Surface>
        </>}
        {active && <section className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base sm:text-lg font-black text-(--text-primary)">Speak naturally</h2>
            <p className="text-xs text-(--text-secondary) truncate">{audioLabel}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <Button
              variant="outline"
              onClick={toggleMuted}
              aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
              title={muted ? 'Unmute' : 'Mute'}
              className={`min-h-[44px] min-w-[44px] h-11 px-3 sm:px-4 shrink-0 transition-colors ${
                muted ? 'border-amber-400/60 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20' : ''
              }`}
            >
              {muted ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
              <span className="hidden sm:inline">{muted ? 'Unmute' : 'Mute'}</span>
            </Button>

            <div className="flex-1 min-w-0">
              <MicrophoneVisualizer stream={stream} active muted={muted} compact />
            </div>

            <Button
              variant="outline"
              onClick={() => { isExplicitEndRef.current = true; void end() }}
              aria-label="End voice session"
              title="End session"
              className="min-h-[44px] min-w-[44px] h-11 px-3 sm:px-4 shrink-0 border-red-300/40 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <PhoneOff className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">End</span>
            </Button>
          </div>
        </section>}
      </div>
    </div>}
    onActivityComplete={handleActivityComplete}
    onActivityOutcome={onActivityOutcome}
    onActivityDifficult={onActivityDifficult}
    onQuestionAnswered={onQuestionAnswered}
  />
}
