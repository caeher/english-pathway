'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Mic, MicOff, RotateCcw } from 'lucide-react'
import type { PronunciationItem } from '@/types'
import type { PronunciationProgress } from '@/features/activities/snapshots/pronunciation'
import { ActivityAudioPlayer } from '@/components/ui/ActivityAudioPlayer'
import { cn } from '@/lib/helpers'
import { scorePronunciation, type PronunciationScore } from '@/lib/audio/pronunciation-scoring'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'

interface SpeechRecognitionResultEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

interface SpeechRecognitionErrorEvent {
  error?: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type TranscriptionResponse = {
  transcript?: unknown
  error?: unknown
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

interface PronunciationProps {
  items: PronunciationItem[]
  initialProgress?: PronunciationProgress
  onProgressChange?: (progress: PronunciationProgress) => void
  onComplete?: (result: {
    score: number
    total: number
    scorePercent: number
    metrics?: Record<string, number>
    correctness?: 'complete' | 'partial' | 'needs-practice'
  }) => void
}

const ACCEPTANCE_THRESHOLD = 70

function recognitionErrorMessage(error?: string): string {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'Microphone access was denied. Allow microphone access in your browser settings or use text verification for practice only.'
  }
  if (error === 'audio-capture') return 'No microphone was found. Check your microphone or use text verification for practice only.'
  if (error === 'no-speech') return 'No speech was detected. Check your microphone and try again.'
  if (error === 'network') return 'Your browser speech-recognition service is unavailable. Use recording mode below to verify your pronunciation.'
  if (error === 'language-not-supported') return 'Your browser cannot recognise English speech. Use recording mode below to verify your pronunciation.'
  return 'Speech recognition failed. Try recording mode below or use text verification for practice only.'
}

export default function Pronunciation({ items, initialProgress, onProgressChange, onComplete }: PronunciationProps) {
  const [current, setCurrent] = useState(initialProgress?.current ?? 0)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [typedText, setTypedText] = useState('')
  const [attemptScore, setAttemptScore] = useState<PronunciationScore | null>(null)
  const [attemptMode, setAttemptMode] = useState<'oral' | 'text' | null>(null)
  const [bestScores, setBestScores] = useState<number[]>(() =>
    initialProgress?.bestScores ?? items.map(() => 0),
  )
  const [oralAttempts, setOralAttempts] = useState(0)
  const [textAttempts, setTextAttempts] = useState(0)
  const [finalScorePercent, setFinalScorePercent] = useState(0)
  const [finalPassedCount, setFinalPassedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useDebouncedProgress(
    { current, bestScores },
    onProgressChange,
    finished,
  )

  const item = items[current]
  const SpeechRecognition = getSpeechRecognition()
  const supportsMic = SpeechRecognition !== null
  const supportsRecording = typeof window !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined'
  const supportsSpeechInput = supportsMic || supportsRecording
  const hidePhraseUntilAttempt = Boolean(item.audio?.src)

  useEffect(() => () => {
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stop()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const recordAttempt = useCallback((text: string, mode: 'oral' | 'text') => {
    const result = scorePronunciation(text, item.phrase)
    setTranscript(text)
    setAttemptScore(result)
    setAttemptMode(mode)

    if (mode === 'oral') {
      setOralAttempts((count) => count + 1)
      setBestScores((scores) => {
        const next = [...scores]
        next[current] = Math.max(next[current] ?? 0, result.percent)
        return next
      })
    } else {
      setTextAttempts((count) => count + 1)
    }
  }, [current, item.phrase])

  const startListening = useCallback(() => {
    if (!SpeechRecognition || listening || recording || transcribing || attemptScore) return

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setError(null)
    setTranscript('')
    setListening(true)

    recognition.onresult = (event) => {
      recordAttempt(event.results[0][0].transcript, 'oral')
    }
    recognition.onerror = (event) => {
      if (event.error === 'aborted') return
      setError(recognitionErrorMessage(event.error))
      setListening(false)
    }
    recognition.onend = () => setListening(false)

    try {
      recognition.start()
    } catch {
      setError('Speech recognition could not start. Please try again.')
      setListening(false)
    }
  }, [SpeechRecognition, attemptScore, listening, recordAttempt, recording, transcribing])

  const transcribeRecording = useCallback(async (audio: Blob) => {
    setTranscribing(true)
    setError(null)
    try {
      const body = new FormData()
      body.set('audio', audio, 'pronunciation.webm')
      const response = await fetch('/api/audio/transcribe', { method: 'POST', body })
      const payload = await response.json().catch(() => ({})) as TranscriptionResponse
      const transcript = typeof payload.transcript === 'string' ? payload.transcript.trim() : ''
      if (!response.ok || !transcript) {
        setError(typeof payload.error === 'string' ? payload.error : 'We could not transcribe that recording. Please try again.')
        return
      }
      recordAttempt(transcript, 'oral')
    } catch {
      setError('We could not transcribe that recording. Check your connection and try again.')
    } finally {
      setTranscribing(false)
    }
  }, [recordAttempt])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }, [])

  const startRecording = useCallback(async () => {
    if (!supportsRecording || listening || recording || transcribing || attemptScore) return

    recognitionRef.current?.stop()
    setError(null)
    setTranscript('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const preferredMimeType = ['audio/webm;codecs=opus', 'audio/webm'].find((mimeType) => MediaRecorder.isTypeSupported(mimeType))
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onstop = () => {
        mediaRecorderRef.current = null
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        setRecording(false)
        const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        if (audio.size === 0) {
          setError('No audio was recorded. Check your microphone and try again.')
          return
        }
        void transcribeRecording(audio)
      }
      recorder.start()
      setRecording(true)
    } catch {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      setError('We could not start recording. Allow microphone access and try again.')
    }
  }, [attemptScore, listening, recording, supportsRecording, transcribeRecording, transcribing])

  const handleCheckText = () => {
    if (!typedText.trim() || attemptScore) return
    setError(null)
    recordAttempt(typedText, 'text')
  }

  const handleRetry = () => {
    recognitionRef.current?.stop()
    stopRecording()
    setListening(false)
    setTranscript('')
    setTypedText('')
    setAttemptScore(null)
    setAttemptMode(null)
    setError(null)
  }

  const handleNext = () => {
    if (!attemptScore) return

    if (current + 1 >= items.length) {
      const finalScores = bestScores.map((score, index) => (
        index === current && attemptMode === 'oral'
          ? Math.max(score, attemptScore.percent)
          : score
      ))
      const oralPassed = finalScores.filter((score) => score >= ACCEPTANCE_THRESHOLD).length
      const scorePercent = oralAttempts > 0
        ? Math.round(finalScores.reduce((sum, score) => sum + score, 0) / items.length)
        : 0

      setBestScores(finalScores)
      setFinalScorePercent(scorePercent)
      setFinalPassedCount(oralPassed)
      setFinished(true)

      onComplete?.({
        score: oralPassed,
        total: items.length,
        scorePercent,
        metrics: { oralAttempts, textAttempts },
        correctness: oralPassed === items.length
          ? 'complete'
          : oralAttempts > 0
            ? 'partial'
            : 'needs-practice',
      })
      return
    }

    setCurrent((value) => value + 1)
    setTranscript('')
    setTypedText('')
    setAttemptScore(null)
    setAttemptMode(null)
    setError(null)
    setPrivacyAcknowledged(false)
  }

  if (finished) return null

  const oralAttempt = attemptMode === 'oral'
  const textAttempt = attemptMode === 'text'

  return (
    <div className="max-w-2xl mx-auto" role="region" aria-label="Speaking practice activity">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">Phrase {current + 1} / {items.length}</span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>
          Best oral: {bestScores[current]}%
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-(--border-primary) bg-(--bg-tertiary) px-4 py-3 text-sm text-(--text-secondary)">
        Speech recognition checks wording, not accent. This is guided speaking practice, not phonetic evaluation.
      </div>

      <div className="p-6 rounded-2xl bg-(--bg-tertiary) border border-(--border-primary) mb-5 text-center">
        {(!hidePhraseUntilAttempt || attemptScore) ? (
          <p className="font-display text-xl font-black text-(--text-primary) mb-3">{item.phrase}</p>
        ) : (
          <p className="font-display text-lg font-bold text-(--text-muted) mb-3">Listen first, then speak the phrase.</p>
        )}

        <ActivityAudioPlayer
          fallbackText={item.phrase}
          curated={item.audio}
          mode="guided"
        />

        {item.hint && <p className="text-xs text-(--text-muted) mt-3">💡 {item.hint}</p>}
      </div>

      {item.contrastPair && (
        <div className="mb-5 rounded-xl border border-(--border-primary) bg-(--bg-card) p-4">
          <p className="text-sm font-display font-bold text-(--text-primary)">{item.contrastPair.label}</p>
          <p className="mt-2 text-sm text-(--text-secondary)">
            <span className="font-semibold">{item.contrastPair.wordA}</span>
            {' vs '}
            <span className="font-semibold">{item.contrastPair.wordB}</span>
            {' · '}
            {item.contrastPair.phoneme}
          </p>
          {attemptScore && (
            <p className="mt-2 text-sm text-(--text-secondary)">{item.contrastPair.tip}</p>
          )}
        </div>
      )}

      {supportsSpeechInput ? (
        <div className="space-y-4">
          {!privacyAcknowledged ? (
            <div className="space-y-3 rounded-xl border border-(--border-primary) bg-(--bg-card) p-4">
              <p className="text-sm text-(--text-secondary)">
                Browser recognition may be processed by your browser provider. Recording mode securely sends a short clip for transcription; it is used only to check this attempt.
              </p>
              <button
                type="button"
                onClick={() => setPrivacyAcknowledged(true)}
                className="w-full rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-display font-bold text-white"
              >
                Continue with microphone
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {supportsMic && (
                <button
                  type="button"
                  onClick={startListening}
                  disabled={listening || recording || transcribing || attemptScore !== null}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 font-display font-bold text-sm cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                    listening ? 'border-(--accent) bg-(--accent-soft) text-(--accent)' : 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
                  )}
                >
                  {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {listening ? 'Listening...' : 'Tap and speak'}
                </button>
              )}

              {supportsRecording && (
                <button
                  type="button"
                  onClick={recording ? stopRecording : () => void startRecording()}
                  disabled={listening || transcribing || attemptScore !== null}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border font-display font-bold text-sm cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    recording ? 'border-red-400 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300' : 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
                  )}
                >
                  {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {transcribing ? 'Checking recording...' : recording ? 'Stop recording and check' : 'Record with secure transcription'}
                </button>
              )}

              <p className="text-center text-xs text-(--text-muted)">
                Use recording mode if browser speech recognition does not work.
              </p>
            </div>
          )}
          {transcript && <p className="text-sm text-(--text-secondary) text-center">I heard: &quot;{transcript}&quot;</p>}
        </div>
      ) : (
        <div className="space-y-4 p-4 rounded-xl border border-(--border-primary) bg-(--bg-card)">
          <p className="text-sm text-(--text-secondary) text-center">
            Your browser does not support speech recognition. Type the phrase for practice only:
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              disabled={attemptScore !== null}
              placeholder="Type the phrase here..."
              className="w-full px-4 py-2.5 rounded-xl border-2 border-(--border-primary) bg-(--bg-primary) text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              aria-label="Type the model phrase"
            />
            <button type="button" onClick={handleCheckText} disabled={!typedText.trim() || attemptScore !== null} className="w-full px-5 py-2.5 rounded-xl bg-(--accent) text-white font-display font-bold text-sm cursor-pointer disabled:opacity-50 transition-colors hover:bg-(--accent-hover)">
              Check text (practice only)
            </button>
          </div>
        </div>
      )}

      {supportsSpeechInput && privacyAcknowledged && (
        <div className="mt-4 space-y-3 rounded-xl border border-dashed border-(--border-primary) bg-(--bg-card) p-4">
          <p className="text-xs text-(--text-muted)">Text check is practice only — it does not measure speaking.</p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              disabled={attemptScore !== null}
              placeholder="Type the phrase for practice..."
              className="w-full px-4 py-2.5 rounded-xl border-2 border-(--border-primary) bg-(--bg-primary) text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              aria-label="Type the phrase for practice only"
            />
            <button type="button" onClick={handleCheckText} disabled={!typedText.trim() || attemptScore !== null} className="w-full px-5 py-2.5 rounded-xl border border-(--border-primary) text-sm font-display font-bold cursor-pointer disabled:opacity-50">
              Check text (practice only)
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-4 text-center text-sm text-red-500">{error}</p>}

      {attemptScore && (
        <div className="mt-5 space-y-4 rounded-xl border border-(--border-primary) bg-(--bg-card) p-4" role="status" aria-live="polite">
          <div className="text-center">
            <p className="text-2xl font-display font-black text-(--accent)">{attemptScore.percent}%</p>
            {oralAttempt && (
              <p className="text-sm text-(--text-secondary)">
                {attemptScore.percent >= ACCEPTANCE_THRESHOLD ? 'Good wording match — keep practicing aloud.' : 'Keep practicing this phrase aloud.'}
              </p>
            )}
            {textAttempt && (
              <p className="text-sm text-(--text-secondary)">
                Text check is practice only — it does not measure speaking.
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2" aria-label="Speaking word comparison">
            {attemptScore.words.map((word, index) => (
              <span key={`${word.target}-${index}`} className={cn('rounded-md px-2 py-1 text-sm font-semibold', word.status === 'correct' ? 'bg-(--success-soft) text-(--success)' : word.status === 'missing' ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400')}>
                {word.target}
              </span>
            ))}
          </div>
          {attemptScore.extraWords.length > 0 && <p className="text-center text-xs text-(--text-muted)">Extra words: {attemptScore.extraWords.join(', ')}</p>}
          <div className="flex justify-center gap-3">
            <button type="button" onClick={handleRetry} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-(--border-primary) text-sm font-display font-bold cursor-pointer">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <button type="button" onClick={handleNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold cursor-pointer">
              {current + 1 >= items.length ? 'View results' : 'Next'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
