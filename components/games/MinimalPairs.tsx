'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Mic, XCircle } from 'lucide-react'
import type { MinimalPairItem } from '@/types'
import type { MinimalPairsProgress } from '@/features/activities/snapshots/minimal-pairs'
import {
  buildDiscriminationFeedback,
  getDefaultMaxReplays,
  getPlayedWord,
  isDiscriminationCorrect,
  pickPlayedVariant,
  type PlayedVariant,
} from '@/features/activities/minimal-pairs'
import { ActivityAudioPlayer } from '@/components/ui/ActivityAudioPlayer'
import { formatAudioMetadata } from '@/lib/audio/curated-audio'
import { cn } from '@/lib/helpers'
import { scoreToPercent } from '@/lib/games/scoring'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'

interface MinimalPairsProps {
  pairs: MinimalPairItem[]
  initialProgress?: MinimalPairsProgress
  onProgressChange?: (progress: MinimalPairsProgress) => void
  onComplete?: (result: {
    score: number
    total: number
    weakItemIndexes?: number[]
    explanations?: string[]
  }) => void
}

function buildInitialProgress(initial?: MinimalPairsProgress): MinimalPairsProgress {
  return initial ?? {
    current: 0,
    phase: 'discriminate',
    playedVariant: null,
    selected: null,
    answered: false,
    score: 0,
    weakItemIndexes: [],
    replaysUsed: 0,
  }
}

export default function MinimalPairs({
  pairs,
  initialProgress,
  onProgressChange,
  onComplete,
}: MinimalPairsProps) {
  const [progress, setProgress] = useState(() => buildInitialProgress(initialProgress))
  const [finished, setFinished] = useState(false)
  const [explanations, setExplanations] = useState<string[]>([])
  const [allowAutoPlay, setAllowAutoPlay] = useState(false)
  const [practiceAcknowledged, setPracticeAcknowledged] = useState(false)
  const hasUserInteractedRef = useRef(false)

  const pair = pairs[progress.current]
  const maxReplays = getDefaultMaxReplays(pair)

  useDebouncedProgress(progress, onProgressChange, finished)

  useEffect(() => {
    if (progress.phase !== 'discriminate' || progress.answered || progress.playedVariant) return
    setProgress((current) => ({
      ...current,
      playedVariant: pickPlayedVariant(),
    }))
  }, [progress.answered, progress.phase, progress.playedVariant])

  const activeVariant = progress.playedVariant
  const heardWord = activeVariant ? getPlayedWord(pair, activeVariant) : ''
  const heardAudio = activeVariant === 'A' ? pair.audioA : activeVariant === 'B' ? pair.audioB : undefined
  const metadata = formatAudioMetadata(heardAudio?.speaker, heardAudio?.accent)

  const updateProgress = useCallback((patch: Partial<MinimalPairsProgress>) => {
    setProgress((current) => ({ ...current, ...patch }))
  }, [])

  const handleAudioInteraction = () => {
    hasUserInteractedRef.current = true
    setAllowAutoPlay(false)
    if (progress.replaysUsed < maxReplays) {
      updateProgress({ replaysUsed: progress.replaysUsed + 1 })
    }
  }

  const handleSelect = (selected: PlayedVariant) => {
    if (progress.answered || !activeVariant) return

    const correct = isDiscriminationCorrect(selected, activeVariant)
    const feedback = buildDiscriminationFeedback(pair, activeVariant, correct)

    setProgress((current) => ({
      ...current,
      selected,
      answered: true,
      score: correct ? current.score + 1 : current.score,
      weakItemIndexes: correct
        ? current.weakItemIndexes
        : [...current.weakItemIndexes, current.current],
    }))

    if (!correct) {
      setExplanations((items) => [...items, feedback])
    }
  }

  const handlePractice = () => {
    updateProgress({ phase: 'practice' })
    setPracticeAcknowledged(false)
  }

  const handleNext = () => {
    if (progress.current + 1 >= pairs.length) {
      setFinished(true)
      const pct = scoreToPercent(progress.score, pairs.length)
      onComplete?.({
        score: pct,
        total: 100,
        weakItemIndexes: progress.weakItemIndexes,
        explanations,
      })
      return
    }

    setProgress((current) => ({
      ...current,
      current: current.current + 1,
      phase: 'discriminate',
      playedVariant: null,
      selected: null,
      answered: false,
      replaysUsed: 0,
    }))
    setPracticeAcknowledged(false)
    if (hasUserInteractedRef.current) {
      setAllowAutoPlay(true)
    }
  }

  if (finished) return null

  const discriminationFeedback = progress.answered && activeVariant
    ? buildDiscriminationFeedback(
      pair,
      activeVariant,
      isDiscriminationCorrect(progress.selected ?? 'A', activeVariant),
    )
    : null

  return (
    <div className="max-w-2xl mx-auto" role="region" aria-label="Minimal pairs activity" aria-describedby="minimal-pairs-description">
      <p id="minimal-pairs-description" className="sr-only">
        Listen to one word from the pair, choose which word you heard, then optionally practice saying both words aloud.
      </p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">
          Pair {progress.current + 1} / {pairs.length}
        </span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>
          Score: {progress.score}
        </span>
      </div>

      <div className="mb-5 rounded-xl border border-(--border-primary) bg-(--bg-card) p-4">
        <p className="text-sm font-display font-bold text-(--text-primary)">{pair.label}</p>
        <p className="mt-2 text-sm text-(--text-secondary)">
          <span className="font-semibold">{pair.wordA}</span>
          {pair.meaningA ? ` (${pair.meaningA})` : ''}
          {' vs '}
          <span className="font-semibold">{pair.wordB}</span>
          {pair.meaningB ? ` (${pair.meaningB})` : ''}
          {' · '}
          {pair.phoneme}
        </p>
      </div>

      {progress.phase === 'discriminate' && (
        <>
          <div className="p-4 rounded-2xl bg-(--bg-tertiary) border border-(--border-primary) mb-5">
            <p className="text-sm font-display font-bold text-(--text-primary) mb-3">Which word did you hear?</p>
            {activeVariant && (
              <ActivityAudioPlayer
                fallbackText={heardWord}
                curated={heardAudio}
                mode="evaluation"
                autoPlay={allowAutoPlay}
                onUserInteraction={handleAudioInteraction}
              />
            )}
            {progress.replaysUsed >= maxReplays && (
              <p className="mt-2 text-xs text-(--text-muted)">Replay limit reached for this item.</p>
            )}
          </div>

          <div className="space-y-3" role="radiogroup" aria-label="Choose the word you heard">
            {(['A', 'B'] as const).map((variant) => {
              const word = variant === 'A' ? pair.wordA : pair.wordB
              const isSel = progress.selected === variant
              const isRight = progress.answered && activeVariant === variant
              const isWrong = progress.answered && isSel && activeVariant !== variant
              let cls = 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
              if (progress.answered) {
                if (isRight) cls = 'border-(--success)/50 bg-(--success-soft)'
                else if (isWrong) cls = 'border-red-400 bg-red-50 dark:bg-red-950/30'
                else cls = 'border-(--border-primary) opacity-40'
              }

              return (
                <motion.button
                  key={variant}
                  type="button"
                  onClick={() => handleSelect(variant)}
                  disabled={progress.answered || !activeVariant}
                  role="radio"
                  aria-checked={isSel}
                  className={cn(
                    'w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                    cls,
                  )}
                >
                  <span className="font-medium text-sm">{word}</span>
                  {isRight && <CheckCircle className="w-5 h-5 ml-auto" style={{ color: 'var(--success)' }} />}
                  {isWrong && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                </motion.button>
              )
            })}
          </div>

          {progress.answered && discriminationFeedback && (
            <div className="mt-5 rounded-xl border border-(--border-primary) bg-(--bg-card) p-4 space-y-2" aria-live="polite">
              <p className="text-sm font-display font-bold text-(--text-primary)">Feedback</p>
              <p className="text-sm text-(--text-secondary)">{discriminationFeedback}</p>
              <p className="text-sm text-(--text-secondary)">
                Transcript: &quot;{heardWord}&quot;
              </p>
              {metadata && <p className="text-xs text-(--text-muted)">{metadata}</p>}
              {heardAudio?.altText && (
                <p className="text-sm text-(--text-secondary)">{heardAudio.altText}</p>
              )}
            </div>
          )}

          {progress.answered && (
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handlePractice}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-(--border-primary) text-sm font-display font-bold cursor-pointer"
              >
                Practice saying both
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold cursor-pointer"
              >
                {progress.current + 1 >= pairs.length ? 'View results' : 'Next'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {progress.phase === 'practice' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-tertiary) px-4 py-3 text-sm text-(--text-secondary)">
            Optional speaking practice — repetition does not affect your score. There is no validated phonetic engine in the browser.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-(--border-primary) bg-(--bg-card) p-4">
              <p className="text-sm font-display font-bold text-(--text-primary)">{pair.wordA}</p>
              {pair.meaningA && <p className="text-xs text-(--text-muted) mt-1">{pair.meaningA}</p>}
              <div className="mt-3">
                <ActivityAudioPlayer fallbackText={pair.wordA} curated={pair.audioA} mode="guided" />
              </div>
            </div>
            <div className="rounded-2xl border border-(--border-primary) bg-(--bg-card) p-4">
              <p className="text-sm font-display font-bold text-(--text-primary)">{pair.wordB}</p>
              {pair.meaningB && <p className="text-xs text-(--text-muted) mt-1">{pair.meaningB}</p>}
              <div className="mt-3">
                <ActivityAudioPlayer fallbackText={pair.wordB} curated={pair.audioB} mode="guided" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-(--border-primary) bg-(--bg-card) p-4">
            <p className="text-sm text-(--text-secondary)">{pair.tip}</p>
          </div>

          {!practiceAcknowledged ? (
            <button
              type="button"
              onClick={() => setPracticeAcknowledged(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-(--border-primary) text-sm font-display font-bold cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              Continue with optional speaking practice
            </button>
          ) : (
            <p className="text-sm text-center text-(--text-secondary)">
              Repeat both words aloud at your own pace. When you are ready, continue to the next pair.
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold cursor-pointer"
            >
              {progress.current + 1 >= pairs.length ? 'View results' : 'Next'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
