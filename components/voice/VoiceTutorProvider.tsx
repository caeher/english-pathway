'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2, Type } from 'lucide-react'
import TutorClientTools from './TutorClientTools'
import MicrophoneVisualizer from './MicrophoneVisualizer'
import LearnSessionLayout from '@/components/learn/LearnSessionLayout'
import { Button } from '@/components/ui/button'
import type { ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import { trackEvent } from '@/lib/analytics/events'
import { enqueueSrsItems } from '@/lib/srs/client'
import { fetchActivityById, showActivity } from '@/lib/learn/client-tools'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { recordEngagementSession } from '@/lib/engagement/client'
import EngagementSummary from '@/components/engagement/EngagementSummary'
import type { ActivityType } from '@/types'
import { saveActivityProgress } from '@/features/progress'
import { stopMediaStream } from '@/lib/audio/microphone'
import { useLearnSessionStore } from '@/stores/useLearnSessionStore'
import { saveTutorMemory } from '@/lib/tutor/client'
import ContinueLearningPrompt from '@/components/progress/ContinueLearningPrompt'
import ProgressSync from '@/components/progress/ProgressSync'

type SessionMode = 'voice' | 'text'
type MicrophoneState = 'idle' | 'checking' | 'ready' | 'denied' | 'unavailable' | 'error'

interface SessionConfig {
  agentId?: string
  signedUrl?: string
  textOnly: boolean
  orchestration?: { sessionId?: string }
}

interface TutorControlsProps {
  mode: SessionMode
  voiceAvailable: boolean
  microphoneState: MicrophoneState
  microphoneStream: MediaStream | null
  onModeChange: (mode: SessionMode) => void
  onCheckMicrophone: () => Promise<boolean>
  onSessionStarted: (sessionId: string) => void
  onSessionEnded: () => void
}

function TutorControls({
  mode,
  voiceAvailable,
  microphoneState,
  microphoneStream,
  onModeChange,
  onCheckMicrophone,
  onSessionStarted,
  onSessionEnded,
}: TutorControlsProps) {
  const { startSession, endSession, status, isMuted, setMuted, sendUserMessage } = useConversation()
  const [message, setMessage] = useState('')
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

  const handleStart = useCallback(async () => {
    setError(null)
    if (mode === 'voice' && !(await onCheckMicrophone())) return

    const response = await fetch('/api/tutor/session')
    if (!response.ok) {
      setError('The tutor is unavailable right now. You can try text mode again later.')
      trackEvent('learn_session_error', { mode, reason: 'session_config' })
      return
    }
    const config = (await response.json()) as SessionConfig
    if (config.textOnly && mode === 'voice') {
      setError('Voice is not configured for this tutor yet. Choose text mode to continue.')
      trackEvent('learn_session_error', { mode, reason: 'voice_unavailable' })
      return
    }
    if (!config.signedUrl && !config.agentId) {
      setError('The tutor is not configured yet. Please choose another time or contact support.')
      trackEvent('learn_session_error', { mode, reason: 'not_configured' })
      return
    }

    const sessionTextOnly = mode === 'text' || config.textOnly
    onSessionStarted(config.orchestration?.sessionId ?? crypto.randomUUID())
    if (config.signedUrl) {
      startSession({ signedUrl: config.signedUrl, textOnly: sessionTextOnly })
    } else if (config.agentId) {
      startSession({ agentId: config.agentId, textOnly: sessionTextOnly })
    }
  }, [mode, onCheckMicrophone, onSessionStarted, startSession])

  const handleModeChange = (nextMode: SessionMode) => {
    setError(null)
    onModeChange(nextMode)
    trackEvent('learn_mode_select', { mode: nextMode })
  }

  const handleActivityComplete = useCallback((result: ActivityCompleteResult) => {
    const pct = result.scorePercent ?? Math.round((result.score / result.total) * 100)
    useLearnSessionStore.getState().recordActivityResult({ activityId: result.activityId, scorePercent: pct, completedAt: new Date().toISOString() })
    sendUserMessage(`I finished activity ${result.activityId} (${result.activityType}) with ${pct}% score.`)
    trackEvent('activity_complete', {
      activity_id: result.activityId,
      activity_type: result.activityType,
      score_percent: pct,
    })
    if (result.chapterId && result.moduleId) {
      void saveActivityProgress({
        activityId: result.activityId,
        activityType: result.activityType,
        chapterId: result.chapterId,
        moduleId: result.moduleId,
        status: 'completed',
        score: pct,
        attempts: 1,
      })
    }
    void recordEngagementSession({
      activityId: result.activityId,
      activityType: result.activityType as ActivityType,
      scorePercent: pct,
    })
    void enqueueSrsItems(result.reviewContentRefs ?? [])
    void saveTutorMemory({
      type: 'learner_memory',
      memoryKey: `activity:${result.activityId}`,
      content: `Activity ${result.activityId} completed with a score of ${pct} percent.`,
      source: 'activity_result',
    })
  }, [sendUserMessage])

  const handleActivityDifficult = useCallback(async (activityId: string) => {
    try {
      const { activity } = await fetchActivityById(activityId)
      await enqueueSrsItems(getReviewContentRefs(activity))
      useLearnSessionStore.getState().requestHelp()
      sendUserMessage('I need a graduated hint for the current activity. Do not reveal the answer yet.')
      void saveTutorMemory({ type: 'learner_memory', memoryKey: `help:${activityId}`, content: 'Learner requested a graduated hint for this activity.', source: 'help_request' })
    } catch {
      // SRS is an enhancement; learning remains usable when it is unavailable.
    }
  }, [sendUserMessage])

  const statusLabel = connecting ? 'Connecting to your tutor' : active ? mode === 'voice' ? 'Voice session active' : 'Text session active' : status === 'disconnected' ? 'Ready to start' : status
  const microphoneMessage = microphoneState === 'checking'
    ? 'Checking your microphone...'
    : microphoneState === 'ready'
      ? 'Microphone ready. You can start when you are ready.'
      : microphoneState === 'denied'
        ? 'Microphone access was denied. Text mode is still available.'
        : microphoneState === 'unavailable'
          ? 'This browser has no microphone access. Text mode is still available.'
          : microphoneState === 'error'
            ? 'We could not access a microphone. Check your device or use text mode.'
            : 'Test your microphone before starting a voice session.'

  return (
    <LearnSessionLayout
      tutorSlot={
        <div className="flex h-full min-h-[360px] flex-col">
          <div className="border-b border-(--border-primary) p-4">
            <h1 className="font-display text-lg font-black text-(--text-primary)">AI English Tutor</h1>
            <p className="mt-1 text-xs text-(--text-muted)">Choose how you want to practice today.</p>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
            {!active && <section className="rounded-2xl border border-(--border-primary) bg-(--bg-card) p-4 sm:p-5" aria-labelledby="session-preflight-heading">
              <p className="text-xs font-bold uppercase tracking-wide text-(--accent)">Before you begin</p>
              <h2 id="session-preflight-heading" className="mt-1 font-display text-xl font-black text-(--text-primary)">Choose your session mode</h2>
              <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">Voice mode lets you speak with the tutor. Text mode works without a microphone or audio permission.</p>
              <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Session mode</legend>
                <button type="button" aria-pressed={mode === 'voice'} disabled={!voiceAvailable} onClick={() => handleModeChange('voice')} className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${mode === 'voice' ? 'border-(--accent) bg-(--accent-soft)' : 'border-(--border-primary) bg-(--bg-primary)'}`}>
                  <span className="flex items-center gap-2 font-bold text-(--text-primary)"><Volume2 className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Voice</span>
                  <span className="mt-1 block text-xs text-(--text-secondary)">{voiceAvailable ? 'Speak and listen with your tutor.' : 'Unavailable in this browser or configuration.'}</span>
                </button>
                <button type="button" aria-pressed={mode === 'text'} onClick={() => handleModeChange('text')} className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${mode === 'text' ? 'border-(--accent) bg-(--accent-soft)' : 'border-(--border-primary) bg-(--bg-primary)'}`}>
                  <span className="flex items-center gap-2 font-bold text-(--text-primary)"><Type className="h-4 w-4 text-(--accent)" aria-hidden="true" /> Text</span>
                  <span className="mt-1 block text-xs text-(--text-secondary)">Chat with the tutor at your own pace.</span>
                </button>
              </fieldset>

              {mode === 'voice' && <div className="mt-4 space-y-3">
                <MicrophoneVisualizer stream={microphoneStream} active={microphoneState === 'ready' || connecting || active} />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => void onCheckMicrophone()} disabled={microphoneState === 'checking' || !voiceAvailable}>
                    {microphoneState === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                    {microphoneState === 'ready' ? 'Check again' : 'Test microphone'}
                  </Button>
                  <p className="text-xs text-(--text-secondary)" aria-live="polite">{microphoneMessage}</p>
                </div>
              </div>}

              {error && <p role="alert" className="mt-4 text-sm font-bold text-red-600">{error}</p>}
              <Button type="button" onClick={() => void handleStart()} disabled={connecting} className="mt-5 w-full sm:w-auto">
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                {connecting ? 'Connecting...' : mode === 'voice' ? 'Start voice lesson' : 'Start text lesson'}
              </Button>
            </section>}

            {active && <section className="space-y-4" aria-labelledby="active-session-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 id="active-session-heading" className="font-display text-xl font-black text-(--text-primary)">{mode === 'voice' ? 'Speak naturally' : 'Write naturally'}</h2><p className="mt-1 text-sm text-(--text-secondary)">{mode === 'voice' ? 'Your tutor is listening. Take your time.' : 'Your tutor will respond in the conversation.'}</p></div>
                <Button variant="outline" onClick={() => { endSession(); onSessionEnded() }} className="gap-2"><PhoneOff className="h-4 w-4" /> End</Button>
              </div>
              {mode === 'voice' && <MicrophoneVisualizer stream={microphoneStream} active />}
              {mode === 'voice' && <Button variant="outline" onClick={() => setMuted(!isMuted)} className="gap-2">{isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{isMuted ? 'Unmute' : 'Mute'}</Button>}
              {mode === 'text' && <form onSubmit={(event) => { event.preventDefault(); if (message.trim()) { sendUserMessage(message.trim()); setMessage('') } }} className="mt-auto flex gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a message..." aria-label="Message to tutor" className="min-w-0 flex-1 rounded-xl border border-(--border-primary) bg-(--bg-card) px-3 py-2 text-sm text-(--text-primary)" /><Button type="submit" size="sm">Send</Button></form>}
            </section>}

            <p className="text-xs capitalize text-(--text-muted)" aria-live="polite">Status: {statusLabel}</p>
          </div>
        </div>
      }
      onActivityComplete={handleActivityComplete}
      onActivityDifficult={handleActivityDifficult}
    />
  )
}

interface VoiceTutorProviderProps {
  children?: React.ReactNode
  initialActivityId?: string
}

export default function VoiceTutorProvider({ children, initialActivityId }: VoiceTutorProviderProps) {
  const [mode, setMode] = useState<SessionMode>('text')
  const [voiceAvailable, setVoiceAvailable] = useState(true)
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>('idle')
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  const stopMicrophone = useCallback(() => {
    stopMediaStream(streamRef.current)
    streamRef.current = null
    setMicrophoneStream(null)
    setMicrophoneState('idle')
  }, [])

  useEffect(() => {
    const available = Boolean(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID && navigator.mediaDevices?.getUserMedia)
    setVoiceAvailable(available)
  }, [])

  useEffect(() => stopMicrophone, [stopMicrophone])

  const checkMicrophone = useCallback(async () => {
    if (!voiceAvailable || !navigator.mediaDevices?.getUserMedia) {
      setMicrophoneState('unavailable')
      trackEvent('learn_microphone', { result: 'unavailable' })
      return false
    }
    stopMicrophone()
    setMicrophoneState('checking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setMicrophoneStream(stream)
      setMicrophoneState('ready')
      trackEvent('learn_microphone', { result: 'granted' })
      return true
    } catch (error) {
      const denied = error instanceof DOMException && error.name === 'NotAllowedError'
      setMicrophoneState(denied ? 'denied' : 'error')
      trackEvent('learn_microphone', { result: denied ? 'denied' : 'error' })
      return false
    }
  }, [stopMicrophone, voiceAvailable])

  const handleModeChange = useCallback((nextMode: SessionMode) => {
    setMode(nextMode)
    if (nextMode === 'text') stopMicrophone()
  }, [stopMicrophone])

  const handleSessionStarted = useCallback((sessionId: string) => {
    sessionIdRef.current = sessionId
  }, [])

  const handleSessionEnded = useCallback(() => {
    if (sessionIdRef.current) {
      void saveTutorMemory({
        type: 'session_summary',
        correlationId: sessionIdRef.current,
        state: 'closed',
        summary: 'Tutor session ended; only the compact session state was retained.',
      })
    }
    sessionIdRef.current = null
    stopMicrophone()
  }, [stopMicrophone])

  useEffect(() => {
    if (!initialActivityId) return
    void showActivity(initialActivityId).catch(() => {
      // A stale activity link should leave the tutor usable without a panel.
    })
  }, [initialActivityId])

  return (
    <ConversationProvider textOnly={mode === 'text'}>
      <EngagementSummary />
      <ProgressSync />
      <ContinueLearningPrompt />
      <TutorClientTools />
      {children ?? <TutorControls mode={mode} voiceAvailable={voiceAvailable} microphoneState={microphoneState} microphoneStream={microphoneStream} onModeChange={handleModeChange} onCheckMicrophone={checkMicrophone} onSessionStarted={handleSessionStarted} onSessionEnded={handleSessionEnded} />}
    </ConversationProvider>
  )
}
