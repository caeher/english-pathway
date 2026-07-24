'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import type { ListeningItem } from '@/types'
import type { ListeningProgress } from '@/features/activities/snapshots/listening'
import { ActivityAudioPlayer } from '@/components/ui/ActivityAudioPlayer'
import { formatAudioMetadata } from '@/lib/audio/curated-audio'
import { cn } from '@/lib/helpers'
import { scoreToPercent } from '@/lib/games/scoring'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'

interface ListeningProps {
  items: ListeningItem[]
  initialProgress?: ListeningProgress
  onProgressChange?: (progress: ListeningProgress) => void
  onComplete?: (result: { score: number; total: number; weakItemIndexes?: number[]; explanations?: string[] }) => void
}

export default function Listening({ items, initialProgress, onProgressChange, onComplete }: ListeningProps) {
  const [current, setCurrent] = useState(initialProgress?.current ?? 0)
  const [selected, setSelected] = useState<number | null>(initialProgress?.selected ?? null)
  const [answered, setAnswered] = useState(initialProgress?.answered ?? false)
  const [score, setScore] = useState(initialProgress?.score ?? 0)
  const [finished, setFinished] = useState(false)
  const [explanations, setExplanations] = useState<string[]>([])
  const [weakItemIndexes, setWeakItemIndexes] = useState<number[]>(initialProgress?.weakItemIndexes ?? [])
  const [allowAutoPlay, setAllowAutoPlay] = useState(false)
  const hasUserInteractedRef = useRef(false)

  useDebouncedProgress(
    { current, selected, answered, score, weakItemIndexes },
    onProgressChange,
    finished,
  )

  const item = items[current]
  const transcript = item.audio?.transcript ?? item.audioText
  const metadata = formatAudioMetadata(item.audio?.speaker, item.audio?.accent)

  const handleSelect = (index: number) => {
    if (answered) return
    setSelected(index)
    setAnswered(true)
    const correct = index === item.correct
    if (correct) setScore((s) => s + 1)
    else {
      setWeakItemIndexes((indexes) => [...indexes, current])
      setExplanations((explanations) => [...explanations, item.explanation ?? `The correct answer is "${item.options[item.correct]}".`])
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
    setSelected(null)
    setAnswered(false)
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
    <div className="max-w-2xl mx-auto" role="region" aria-label="Listening activity" aria-describedby="listening-mode-description">
      <p id="listening-mode-description" className="sr-only">
        Listen to the audio before choosing an answer. The transcript is revealed after you respond.
      </p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">
          Audio {current + 1} / {items.length}
        </span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>
          Score: {score}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-(--bg-tertiary) border border-(--border-primary) mb-5">
        <ActivityAudioPlayer
          fallbackText={item.audioText}
          curated={item.audio}
          mode={item.mode}
          autoPlay={allowAutoPlay}
          onUserInteraction={handleAudioInteraction}
        />
      </div>

      <h3 className="font-display text-lg font-bold text-(--text-primary) mb-4">{item.question}</h3>

      <div className="space-y-3" role="radiogroup" aria-label="Options. Select one answer to submit it.">
        {item.options.map((opt, i) => {
          const isRight = i === item.correct
          const isSel = i === selected
          let cls = 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
          if (answered) {
            if (isRight) cls = 'border-(--success)/50 bg-(--success-soft)'
            else if (isSel) cls = 'border-red-400 bg-red-50 dark:bg-red-950/30'
            else cls = 'border-(--border-primary) opacity-40'
          }
          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              role="radio"
              aria-checked={isSel}
              className={cn(
                'w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                cls
              )}
            >
              <span className="font-medium text-sm">{opt}</span>
              {answered && isRight && <CheckCircle className="w-5 h-5 ml-auto" style={{ color: 'var(--success)' }} />}
              {answered && isSel && !isRight && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
            </motion.button>
          )
        })}
      </div>

      {answered && (
        <div className="mt-5 rounded-xl border border-(--border-primary) bg-(--bg-card) p-4 space-y-2" aria-live="polite">
          <p className="text-sm font-display font-bold text-(--text-primary)">Transcript</p>
          <p className="text-sm text-(--text-secondary)">&quot;{transcript}&quot;</p>
          {metadata && <p className="text-xs text-(--text-muted)">{metadata}</p>}
          {item.audio?.altText && (
            <p className="text-sm text-(--text-secondary)">{item.audio.altText}</p>
          )}
        </div>
      )}

      {answered && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          >
            {current + 1 >= items.length ? 'View results' : 'Next'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {answered && (selected === item.correct ? 'Correct answer.' : 'Incorrect answer.')}
      </div>
    </div>
  )
}
