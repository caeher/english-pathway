'use client'

import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { DictationItem } from '@/types'
import type { DictationProgress } from '@/features/activities/snapshots/dictation'
import { ActivityAudioPlayer } from '@/components/ui/ActivityAudioPlayer'
import { formatAudioMetadata } from '@/lib/audio/curated-audio'
import { cn } from '@/lib/helpers'
import { scoreToPercent } from '@/lib/games/scoring'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'

function similarity(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:'"]/g, '')
  return norm(a) === norm(b)
}

interface DictationProps {
  items: DictationItem[]
  initialProgress?: DictationProgress
  onProgressChange?: (progress: DictationProgress) => void
  onComplete?: (result: { score: number; total: number; weakItemIndexes?: number[]; explanations?: string[] }) => void
}

export default function Dictation({ items, initialProgress, onProgressChange, onComplete }: DictationProps) {
  const [current, setCurrent] = useState(initialProgress?.current ?? 0)
  const [value, setValue] = useState(initialProgress?.value ?? '')
  const [answered, setAnswered] = useState(initialProgress?.answered ?? false)
  const [isCorrect, setIsCorrect] = useState(() => {
    if (!initialProgress?.answered) return false
    const item = items[initialProgress.current]
    return item ? similarity(initialProgress.value, item.audioText) : false
  })
  const [score, setScore] = useState(initialProgress?.score ?? 0)
  const [finished, setFinished] = useState(false)
  const [weakItemIndexes, setWeakItemIndexes] = useState<number[]>(initialProgress?.weakItemIndexes ?? [])
  const [explanations, setExplanations] = useState<string[]>([])
  const [allowAutoPlay, setAllowAutoPlay] = useState(false)
  const hasUserInteractedRef = useRef(false)

  useDebouncedProgress(
    { current, value, answered, score, weakItemIndexes },
    onProgressChange,
    finished,
  )

  const item = items[current]
  const expectedAnswer = item.audio?.transcript ?? item.audioText
  const metadata = formatAudioMetadata(item.audio?.speaker, item.audio?.accent)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (answered || !value.trim()) return
    const correct = similarity(value, expectedAnswer)
    setAnswered(true)
    setIsCorrect(correct)
    if (correct) setScore((s) => s + 1)
    else {
      setWeakItemIndexes((indexes) => [...indexes, current])
      setExplanations((items) => [...items, `Listen again, then compare your response with "${expectedAnswer}".`])
    }
  }

  const handleNext = () => {
    if (current + 1 >= items.length) {
      setFinished(true)
      const pct = scoreToPercent(score, items.length)
      onComplete?.({ score: pct, total: 100, weakItemIndexes, explanations })
      return
    }
    setCurrent((c) => c + 1)
    setValue('')
    setAnswered(false)
    setIsCorrect(false)
    if (hasUserInteractedRef.current) {
      setAllowAutoPlay(true)
    }
  }

  const handleAudioInteraction = () => {
    hasUserInteractedRef.current = true
    setAllowAutoPlay(false)
  }

  if (finished) return null

  return (
    <div className="max-w-2xl mx-auto" role="region" aria-label="Dictation activity" aria-describedby="dictation-mode-description">
      <p id="dictation-mode-description" className="sr-only">
        Listen to the audio and write what you hear. The transcript is revealed after you check your answer.
      </p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">
          Dictation {current + 1} / {items.length}
        </span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>
          Score: {score}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-(--bg-tertiary) border border-(--border-primary) mb-5">
        <ActivityAudioPlayer
          fallbackText={item.audioText}
          curated={item.audio}
          autoPlay={allowAutoPlay}
          onUserInteraction={handleAudioInteraction}
        />
        {item.hint && <p className="text-xs text-(--text-muted) mt-3">💡 {item.hint}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="dictation-input" className="sr-only">
          Write what you heard
        </label>
        <input
          id="dictation-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={answered}
          placeholder="Write what you heard..."
          className={cn(
            'w-full px-4 py-3.5 rounded-2xl border-2 text-lg outline-none font-display focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
            answered
              ? isCorrect
                ? 'border-(--success)/50 bg-(--success-soft)'
                : 'border-red-400 bg-red-50 dark:bg-red-950/30'
              : 'border-(--border-primary) bg-(--bg-card) focus:border-(--accent)'
          )}
        />
        {!answered && (
          <button
            type="submit"
            disabled={!value.trim()}
            className="px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Check
          </button>
        )}
        {answered && (
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-card) p-4 space-y-2" aria-live="polite">
            <p className="text-sm font-display font-bold text-(--text-primary)">Transcript</p>
            <p className={cn('text-sm font-medium', isCorrect ? 'text-(--success)' : 'text-red-600')}>
              &quot;{expectedAnswer}&quot;
            </p>
            {metadata && <p className="text-xs text-(--text-muted)">{metadata}</p>}
            {item.audio?.altText && (
              <p className="text-sm text-(--text-secondary)">{item.audio.altText}</p>
            )}
          </div>
        )}
      </form>

      {answered && (
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
        {answered && (isCorrect ? 'Correct' : 'Incorrect')}
      </div>
    </div>
  )
}
