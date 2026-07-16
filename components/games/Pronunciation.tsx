'use client'

import { useState, useCallback } from 'react'
import { Mic, MicOff, ArrowRight } from 'lucide-react'
import type { PronunciationItem } from '@/types'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { cn } from '@/lib/helpers'
import ActivityResult from './ActivityResult'
import { scoreToPercent } from '@/lib/games/scoring'

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
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

function comparePhrases(spoken: string, target: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:'"]/g, '')
  const a = norm(spoken)
  const b = norm(target)
  return a === b || a.includes(b) || b.includes(a)
}

interface PronunciationProps {
  items: PronunciationItem[]
  onComplete?: (result: { score: number; total: number }) => void
}

export default function Pronunciation({ items, onComplete }: PronunciationProps) {
  const [current, setCurrent] = useState(0)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [typedText, setTypedText] = useState('')
  const [selfRated, setSelfRated] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const item = items[current]
  const SpeechRecognition = getSpeechRecognition()
  const supportsMic = SpeechRecognition !== null

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setListening(true)
    setTranscript('')

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      if (comparePhrases(text, item.phrase)) {
        setScore((s) => s + 1)
        setSelfRated(true)
      } else {
        setSelfRated(false)
      }
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }, [SpeechRecognition, item.phrase])

  const handleSelfRate = (good: boolean) => {
    setSelfRated(good)
    if (good) setScore((s) => s + 1)
  }

  const handleCheckText = () => {
    const isCorrect = comparePhrases(typedText, item.phrase)
    setSelfRated(isCorrect)
    if (isCorrect) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (current + 1 >= items.length) {
      setFinished(true)
      const pct = scoreToPercent(score, items.length)
      onComplete?.({ score: pct, total: 100 })
      return
    }
    setCurrent((c) => c + 1)
    setTranscript('')
    setTypedText('')
    setSelfRated(null)
  }

  const handleRestart = () => {
    setCurrent(0)
    setTranscript('')
    setTypedText('')
    setSelfRated(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = scoreToPercent(score, items.length)
    return (
      <ActivityResult
        percent={pct}
        score={score}
        total={items.length}
        onRetry={handleRestart}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto" role="region" aria-label="Pronunciation activity">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">
          Phrase {current + 1} / {items.length}
        </span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>
          Score: {score}
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
            disabled={listening || selfRated !== null}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 font-display font-bold text-sm cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
              listening
                ? 'border-(--accent) bg-(--accent-soft) text-(--accent)'
                : 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
            )}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {listening ? 'Listening...' : 'Tap and speak'}
          </button>
          {transcript && (
            <p className="text-sm text-(--text-secondary) text-center">
              I heard: &quot;{transcript}&quot;
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-4 rounded-xl border border-(--border-primary) bg-(--bg-card)">
          <p className="text-sm text-(--text-secondary) text-center">
            Your browser does not support speech recognition. Type the phrase to verify it:
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              disabled={selfRated !== null}
              placeholder="Type the phrase here..."
              className="w-full px-4 py-2.5 rounded-xl border-2 border-(--border-primary) bg-(--bg-primary) text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              aria-label="Type the model phrase"
            />
            <button
              type="button"
              onClick={handleCheckText}
              disabled={!typedText.trim() || selfRated !== null}
              className="w-full px-5 py-2.5 rounded-xl bg-(--accent) text-white font-display font-bold text-sm cursor-pointer disabled:opacity-50 transition-colors hover:bg-(--accent-hover)"
            >
              Check text
            </button>
          </div>
          {selfRated !== null && (
            <p className={cn(
              "text-center text-sm font-bold mt-2",
              selfRated ? "text-(--success)" : "text-red-500"
            )}>
              {selfRated ? "✓ Excellent! It matches perfectly." : "✗ No match. Review the phrase and try again."}
            </p>
          )}
        </div>
      )}

      {selfRated !== null && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold cursor-pointer"
          >
            {current + 1 >= items.length ? 'View results' : 'Next'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {selfRated === true && 'Correct pronunciation'}
        {selfRated === false && 'Keep practicing'}
      </div>
    </div>
  )
}
