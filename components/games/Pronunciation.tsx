'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Mic, MicOff, RotateCcw } from 'lucide-react'
import type { PronunciationItem } from '@/types'
import type { PronunciationProgress } from '@/features/activities/snapshots/pronunciation'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { cn } from '@/lib/helpers'
import ActivityResult from './ActivityResult'
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
  onComplete?: (result: { score: number; total: number; scorePercent: number }) => void
}

const ACCEPTANCE_THRESHOLD = 70

function recognitionErrorMessage(error?: string): string {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'Microphone access was denied. Allow microphone access in your browser settings or use text verification.'
  }
  if (error === 'audio-capture') return 'No microphone was found. Check your microphone or use text verification.'
  return 'Speech recognition failed. Please try again or use text verification.'
}

export default function Pronunciation({ items, initialProgress, onProgressChange, onComplete }: PronunciationProps) {
  const [current, setCurrent] = useState(initialProgress?.current ?? 0)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [typedText, setTypedText] = useState('')
  const [attemptScore, setAttemptScore] = useState<PronunciationScore | null>(null)
  const [bestScores, setBestScores] = useState<number[]>(() =>
    initialProgress?.bestScores ?? items.map(() => 0),
  )
  const [finalScorePercent, setFinalScorePercent] = useState(0)
  const [finalPassedCount, setFinalPassedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useDebouncedProgress(
    { current, bestScores },
    onProgressChange,
    finished,
  )

  const item = items[current]
  const SpeechRecognition = getSpeechRecognition()
  const supportsMic = SpeechRecognition !== null

  useEffect(() => () => {
    recognitionRef.current?.stop()
  }, [])

  const recordAttempt = useCallback((text: string) => {
    const result = scorePronunciation(text, item.phrase)
    setTranscript(text)
    setAttemptScore(result)
    setBestScores((scores) => {
      const next = [...scores]
      next[current] = Math.max(next[current] ?? 0, result.percent)
      return next
    })
  }, [current, item.phrase])

  const startListening = useCallback(() => {
    if (!SpeechRecognition || listening || attemptScore) return

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setError(null)
    setTranscript('')
    setListening(true)

    recognition.onresult = (event) => {
      recordAttempt(event.results[0][0].transcript)
    }
    recognition.onerror = (event) => {
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
  }, [SpeechRecognition, attemptScore, listening, recordAttempt])

  const handleCheckText = () => {
    if (!typedText.trim() || attemptScore) return
    setError(null)
    recordAttempt(typedText)
  }

  const handleRetry = () => {
    recognitionRef.current?.stop()
    setListening(false)
    setTranscript('')
    setTypedText('')
    setAttemptScore(null)
    setError(null)
  }

  const handleNext = () => {
    if (!attemptScore) return

    if (current + 1 >= items.length) {
      const finalScores = bestScores.map((score, index) => index === current ? Math.max(score, attemptScore.percent) : score)
      const scorePercent = Math.round(finalScores.reduce((sum, score) => sum + score, 0) / items.length)
      const passed = finalScores.filter((score) => score >= ACCEPTANCE_THRESHOLD).length
      setBestScores(finalScores)
      setFinalScorePercent(scorePercent)
      setFinalPassedCount(passed)
      setFinished(true)
      onComplete?.({ score: passed, total: items.length, scorePercent })
      return
    }

    setCurrent((value) => value + 1)
    setTranscript('')
    setTypedText('')
    setAttemptScore(null)
    setError(null)
  }

  const handleRestart = () => {
    setCurrent(0)
    setTranscript('')
    setTypedText('')
    setAttemptScore(null)
    setBestScores(items.map(() => 0))
    setFinalScorePercent(0)
    setFinalPassedCount(0)
    setError(null)
    setFinished(false)
  }

  if (finished) {
    return <ActivityResult percent={finalScorePercent} score={finalPassedCount} total={items.length} onRetry={handleRestart} />
  }

  return (
    <div className="max-w-2xl mx-auto" role="region" aria-label="Pronunciation activity">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">Phrase {current + 1} / {items.length}</span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>
          Best: {bestScores[current]}%
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-(--bg-tertiary) border border-(--border-primary) mb-5 text-center">
        <p className="font-display text-xl font-black text-(--text-primary) mb-3">{item.phrase}</p>
        <SpeakButton text={item.phrase} size="md" label="Listen to model pronunciation" />
        {item.hint && <p className="text-xs text-(--text-muted) mt-3">💡 {item.hint}</p>}
      </div>

      {supportsMic ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={startListening}
            disabled={listening || attemptScore !== null}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 font-display font-bold text-sm cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
              listening ? 'border-(--accent) bg-(--accent-soft) text-(--accent)' : 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
            )}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {listening ? 'Listening...' : 'Tap and speak'}
          </button>
          {transcript && <p className="text-sm text-(--text-secondary) text-center">I heard: &quot;{transcript}&quot;</p>}
        </div>
      ) : (
        <div className="space-y-4 p-4 rounded-xl border border-(--border-primary) bg-(--bg-card)">
          <p className="text-sm text-(--text-secondary) text-center">Your browser does not support speech recognition. Type the phrase to verify it:</p>
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
              Check text
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-4 text-center text-sm text-red-500">{error}</p>}

      {attemptScore && (
        <div className="mt-5 space-y-4 rounded-xl border border-(--border-primary) bg-(--bg-card) p-4" role="status" aria-live="polite">
          <div className="text-center">
            <p className="text-2xl font-display font-black text-(--accent)">{attemptScore.percent}%</p>
            <p className="text-sm text-(--text-secondary)">{attemptScore.percent >= ACCEPTANCE_THRESHOLD ? 'Great pronunciation!' : 'Keep practicing this phrase.'}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2" aria-label="Pronunciation word comparison">
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
