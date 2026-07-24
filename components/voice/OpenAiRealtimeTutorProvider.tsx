'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react'
import MicrophoneVisualizer from './MicrophoneVisualizer'
import LearnSessionLayout from '@/components/learn/LearnSessionLayout'
import { Button, InlineError, Surface } from '@/components/ui'
import { trackEvent } from '@/lib/analytics/events'
import { useTutorActivityActions } from './hooks/useTutorActivityActions'
import type { SessionMode } from './session-types'
import { showActivity } from '@/lib/learn/client-tools'
import { executeTutorTool } from '@/lib/learn/execute-tutor-tool'

type Credits = { audioSecondsRemaining: number; assistantMessagesRemaining: number }

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

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function OpenAiRealtimeTutorProvider({ initialActivityId }: { initialActivityId?: string }) {
  const mode: SessionMode = 'voice'
  const [active, setActive] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [credits, setCredits] = useState<Credits | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const creditSessionIdRef = useRef<string | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const maxSecondsRef = useRef(0)
  const endTimerRef = useRef<number | null>(null)
  const endingRef = useRef(false)
  const processedCallIdsRef = useRef<Set<string>>(new Set())

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

  const { onActivityComplete, onActivityDifficult, onQuestionAnswered, flushPendingMessages } = useTutorActivityActions(sendUserMessage)

  const loadCredits = useCallback(async () => {
    const response = await fetch('/api/credits')
    if (!response.ok) return
    setCredits(await response.json() as Credits)
  }, [])

  useEffect(() => { void loadCredits() }, [loadCredits])

  useEffect(() => {
    if (!initialActivityId) return
    void showActivity(initialActivityId).catch(() => {})
  }, [initialActivityId])

  const end = useCallback(async () => {
    if (endingRef.current) return
    endingRef.current = true
    if (endTimerRef.current !== null) window.clearTimeout(endTimerRef.current)
    const startedAt = startedAtRef.current
    const seconds = startedAt ? Math.min(maxSecondsRef.current, Math.max(0, Math.ceil((Date.now() - startedAt) / 1000))) : 0
    const creditSessionId = creditSessionIdRef.current
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
    startedAtRef.current = null
    creditSessionIdRef.current = null
    if (creditSessionId) {
      const response = await fetch('/api/tutor/realtime/finish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: creditSessionId, seconds }),
      })
      if (response.ok) setCredits(await response.json() as Credits)
    }
    if (seconds) trackEvent('learn_session_end', { mode, duration_seconds: seconds, provider: 'openai' })
    endingRef.current = false
  }, [mode])

  useEffect(() => () => { void end() }, [end])

  const start = useCallback(async () => {
    setError(null)
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
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') void end()
      }

      if (mode === 'voice') {
        const microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
        setStream(microphone)
        microphone.getTracks().forEach((track) => pc.addTrack(track, microphone))
      }
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
      const response = await fetch('/api/tutor/realtime', { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: offer.sdp })
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(payload?.error ?? 'Voice tutor is unavailable.')
      }
      const creditSessionId = response.headers.get('X-Audio-Credit-Session')
      const maxSeconds = Number(response.headers.get('X-Audio-Credit-Max-Seconds'))
      if (!creditSessionId || !Number.isFinite(maxSeconds) || maxSeconds < 1) throw new Error('Voice credit session was not created.')
      creditSessionIdRef.current = creditSessionId
      maxSecondsRef.current = maxSeconds
      await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() })
      startedAtRef.current = Date.now()
      setActive(true)
      trackEvent('learn_session_start', { mode, provider: 'openai' })
      endTimerRef.current = window.setTimeout(() => {
        setError('Your voice credits are finished for this account.')
        void end()
      }, maxSeconds * 1_000)
      channel.onopen = () => {
        flushPendingMessages()
        sendUserMessage('Greet me briefly, then use showGrammar with a short welcome tip as structured blocks (one paragraph block) in the learning panel, and ask what English skill I want to practise today.')
      }
    } catch (caughtError) {
      if (creditSessionIdRef.current) await end()
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
  }, [end, flushPendingMessages, handleFunctionCall, mode, sendUserMessage])

  const toggleMuted = () => {
    stream?.getAudioTracks().forEach((track) => { track.enabled = muted })
    setMuted((current) => !current)
  }

  const voiceSupported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
  const audioLabel = credits ? `${formatDuration(credits.audioSecondsRemaining)} voice remaining` : 'Voice credits loading…'

  return <LearnSessionLayout
    sessionMode={mode}
    tutorActive={active}
    tutorConnecting={connecting}
    showEngagement={false}
    tutorSlot={<div className="flex h-full min-h-[360px] flex-col">
      <div className="border-b border-(--border-primary) p-4"><h1 className="font-display text-lg font-black text-(--text-primary)">AI English Tutor</h1><p className="mt-1 text-xs text-(--text-muted)">OpenAI realtime voice tutor · {audioLabel}</p></div>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        {!active && <Surface as="section" padding="md" className="sm:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-(--accent)">Before you begin</p><h2 className="mt-1 font-display text-xl font-black text-(--text-primary)">Start a voice lesson</h2>
          <div className="mt-4 rounded-xl border border-(--accent) bg-(--accent-soft) p-4"><span className="flex items-center gap-2 font-bold text-(--text-primary)"><Volume2 className="h-4 w-4 text-(--accent)" />Voice</span><span className="mt-1 block text-xs text-(--text-secondary)">Speak and listen with your tutor. The English helper remains available for text chat.</span></div>
          {error && <InlineError message={error} onRetry={() => void start()} className="mt-4" />}
          <Button type="button" onClick={() => void start()} disabled={connecting || !voiceSupported || (credits?.audioSecondsRemaining === 0)} className="mt-5 w-full sm:w-auto">{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}{connecting ? 'Connecting…' : 'Start voice lesson'}</Button>
        </Surface>}
        {active && <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-black text-(--text-primary)">Speak naturally</h2><p className="mt-1 text-sm text-(--text-secondary)">{audioLabel}</p></div><Button variant="outline" onClick={() => void end()}><PhoneOff className="h-4 w-4" /> End</Button></div>
          <MicrophoneVisualizer stream={stream} active /><Button variant="outline" onClick={toggleMuted}>{muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{muted ? 'Unmute' : 'Mute'}</Button>
        </section>}
      </div>
    </div>}
    onActivityComplete={onActivityComplete}
    onActivityDifficult={onActivityDifficult}
    onQuestionAnswered={onQuestionAnswered}
  />
}
