'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ConversationProvider } from '@elevenlabs/react'
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2, Type } from 'lucide-react'
import TutorClientTools from './TutorClientTools'
import MicrophoneVisualizer from './MicrophoneVisualizer'
import { useMicrophoneAccess, useVoiceAvailability } from './hooks/useMicrophoneAccess'
import { useTutorActivityActions } from './hooks/useTutorActivityActions'
import { useTutorSession } from './hooks/useTutorSession'
import type { MicrophoneState, SessionMode, SessionOrchestration } from './session-types'
import LearnSessionLayout from '@/components/learn/LearnSessionLayout'
import { Button, InlineError, Surface } from '@/components/ui'
import { trackEvent } from '@/lib/analytics/events'
import { showActivity } from '@/lib/learn/client-tools'
import EngagementSummary from '@/components/engagement/EngagementSummary'
import { saveTutorMemory } from '@/lib/tutor/client'
import { buildOrchestrationMessage } from '@/lib/tutor/send-orchestration'
import ContinueLearningPrompt from '@/components/progress/ContinueLearningPrompt'
import OpenAiRealtimeTutorProvider from './OpenAiRealtimeTutorProvider'

interface TutorControlsProps {
  mode: SessionMode
  voiceAvailable: boolean
  microphoneState: MicrophoneState
  microphoneStream: MediaStream | null
  onModeChange: (mode: SessionMode) => void
  onCheckMicrophone: () => Promise<boolean>
  onSessionStarted: (sessionId: string, orchestration?: SessionOrchestration) => void
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
  const orchestrationRef = useRef<SessionOrchestration | undefined>(undefined)
  const bootstrapSentRef = useRef(false)

  const handleSessionStarted = useCallback((sessionId: string, orchestration?: SessionOrchestration) => {
    orchestrationRef.current = orchestration
    bootstrapSentRef.current = false
    onSessionStarted(sessionId, orchestration)
  }, [onSessionStarted])

  const {
    active,
    connecting,
    status,
    error,
    clearError,
    isMuted,
    setMuted,
    sendUserMessage,
    start,
    end,
  } = useTutorSession({ mode, onCheckMicrophone, onSessionStarted: handleSessionStarted, onSessionEnded })
  const { onActivityComplete, onActivityDifficult, onQuestionAnswered, flushPendingMessages } = useTutorActivityActions(sendUserMessage)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!active) {
      bootstrapSentRef.current = false
      return
    }
    if (bootstrapSentRef.current) return
    bootstrapSentRef.current = true
    flushPendingMessages()
    const bootstrap = buildOrchestrationMessage(orchestrationRef.current)
    if (bootstrap) sendUserMessage(bootstrap)
  }, [active, flushPendingMessages, sendUserMessage])

  const handleModeChange = (nextMode: SessionMode) => {
    clearError()
    onModeChange(nextMode)
    trackEvent('learn_mode_select', { mode: nextMode })
  }

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
            {!active && <Surface as="section" padding="md" className="sm:p-5" aria-labelledby="session-preflight-heading">
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

              {error && <InlineError message={error} onRetry={() => void start()} className="mt-4" />}
              <Button type="button" onClick={() => void start()} disabled={connecting} className="mt-5 w-full sm:w-auto">
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                {connecting ? 'Connecting...' : mode === 'voice' ? 'Start voice lesson' : 'Start text lesson'}
              </Button>
            </Surface>}

            {active && <section className="space-y-4" aria-labelledby="active-session-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 id="active-session-heading" className="font-display text-xl font-black text-(--text-primary)">{mode === 'voice' ? 'Speak naturally' : 'Write naturally'}</h2><p className="mt-1 text-sm text-(--text-secondary)">{mode === 'voice' ? 'Your tutor is listening. Take your time.' : 'Your tutor will respond in the conversation.'}</p></div>
                <Button variant="outline" onClick={end} className="gap-2"><PhoneOff className="h-4 w-4" /> End</Button>
              </div>
              {mode === 'voice' && <MicrophoneVisualizer stream={microphoneStream} active />}
              {mode === 'voice' && <Button variant="outline" onClick={() => setMuted(!isMuted)} className="gap-2">{isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{isMuted ? 'Unmute' : 'Mute'}</Button>}
              {mode === 'text' && <form onSubmit={(event) => { event.preventDefault(); if (message.trim()) { sendUserMessage(message.trim()); setMessage('') } }} className="mt-auto flex gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type a message..." aria-label="Message to tutor" className="min-w-0 flex-1 rounded-xl border border-(--border-primary) bg-(--bg-card) px-3 py-2 text-sm text-(--text-primary)" /><Button type="submit" size="sm">Send</Button></form>}
            </section>}

            <p className="text-xs capitalize text-(--text-muted)" aria-live="polite">Status: {statusLabel}</p>
          </div>
        </div>
      }
      onActivityComplete={onActivityComplete}
      onActivityDifficult={onActivityDifficult}
      onQuestionAnswered={onQuestionAnswered}
    />
  )
}

interface VoiceTutorProviderProps {
  children?: React.ReactNode
  initialActivityId?: string
}

export default function VoiceTutorProvider({ children, initialActivityId }: VoiceTutorProviderProps) {
  if (!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID) {
    return <OpenAiRealtimeTutorProvider initialActivityId={initialActivityId} />
  }

  return (
    <ElevenLabsVoiceTutorProvider initialActivityId={initialActivityId}>
      {children}
    </ElevenLabsVoiceTutorProvider>
  )
}

function ElevenLabsVoiceTutorProvider({ children, initialActivityId }: VoiceTutorProviderProps) {
  const [mode, setMode] = useState<SessionMode>('text')
  const sessionIdRef = useRef<string | null>(null)
  const voiceAvailable = useVoiceAvailability()
  const microphoneResult = useCallback((result: 'unavailable' | 'granted' | 'denied' | 'error') => {
    trackEvent('learn_microphone', { result })
  }, [])
  const { state: microphoneState, stream: microphoneStream, check: checkMicrophone, stop: stopMicrophone } = useMicrophoneAccess({ available: voiceAvailable, onResult: microphoneResult })

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
      <ContinueLearningPrompt />
      <TutorClientTools />
      {children ?? <TutorControls mode={mode} voiceAvailable={voiceAvailable} microphoneState={microphoneState} microphoneStream={microphoneStream} onModeChange={handleModeChange} onCheckMicrophone={checkMicrophone} onSessionStarted={handleSessionStarted} onSessionEnded={handleSessionEnded} />}
    </ConversationProvider>
  )
}
