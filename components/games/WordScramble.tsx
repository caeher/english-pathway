import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RotateCcw } from 'lucide-react'
import type { WordScrambleItem } from '../../types'
import type { WordScrambleProgress } from '@/features/activities/snapshots/word-scramble'
import { shuffleArray, cn } from '@/lib/helpers'
import { useReducedMotion } from '@/lib/games/useReducedMotion'
import { SpeakButton } from '@/components/ui/SpeakButton'
import ActivityResult from './ActivityResult'
import { scoreToPercent } from '@/lib/games/scoring'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'

interface WordScrambleProps {
  words: WordScrambleItem[]
  initialProgress?: WordScrambleProgress
  onProgressChange?: (progress: WordScrambleProgress) => void
  onComplete?: (result: { score: number; total: number }) => void
}

function scrambleWord(word: string): string[] {
  const letters = word.toUpperCase().split('')
  return shuffleArray(letters)
}

export default function WordScramble({ words, initialProgress, onProgressChange, onComplete }: WordScrambleProps) {
  const reducedMotion = useReducedMotion()
  const [current, setCurrent] = useState(initialProgress?.current ?? 0)
  const [selected, setSelected] = useState<string[]>(initialProgress?.selected ?? [])
  const [placedIndices, setPlacedIndices] = useState<number[]>(initialProgress?.placedIndices ?? [])
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [score, setScore] = useState(initialProgress?.score ?? 0)
  const [done, setDone] = useState(false)

  useDebouncedProgress(
    { current, selected, placedIndices, score },
    onProgressChange,
    done,
  )

  const item = words[current]
  const target = item.word.toUpperCase()
  const shuffled = useMemo(() => scrambleWord(item.word), [item.word])
  const isComplete = selected.join('') === target

  const handleLetterClick = (letter: string, idx: number) => {
    const nextCorrect = target[selected.length]
    if (letter === nextCorrect) {
      setSelected((s) => [...s, letter])
      setPlacedIndices((p) => [...p, idx])
      setWrongIdx(null)
      if (selected.length + 1 === target.length) {
        setScore((sc) => sc + 1)
      }
    } else {
      setWrongIdx(idx)
      setTimeout(() => setWrongIdx(null), 400)
    }
  }

  const handleClear = () => {
    setSelected([])
    setPlacedIndices([])
    setWrongIdx(null)
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected([])
    setPlacedIndices([])
    setWrongIdx(null)
    setScore(0)
    setDone(false)
  }

  const handleNext = () => {
    if (current + 1 >= words.length) {
      setDone(true)
      const pct = scoreToPercent(score, words.length)
      onComplete?.({ score: pct, total: 100 })
      return
    }
    setCurrent((c) => c + 1)
    setSelected([])
    setPlacedIndices([])
    setWrongIdx(null)
  }

  if (done) {
    const pct = scoreToPercent(score, words.length)
    return (
      <ActivityResult
        percent={pct}
        score={score}
        total={words.length}
        onRetry={handleRestart}
      />
    )
  }

  if (isComplete) {
    return (
      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-display font-bold text-(--text-muted)">
            Word {current + 1} / {words.length}
          </span>
          <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>
            Score: {score}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {target.split('').map((l, i) => (
            <span key={i} className="w-10 h-10 flex items-center justify-center rounded-xl bg-(--success-soft) border-2 border-(--success)/40 font-display font-bold text-lg text-(--text-primary)">
              {l}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 p-4 rounded-xl bg-(--success-soft) border border-(--success)/20 text-(--text-primary) font-display font-bold text-sm mb-6">
          <CheckCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--success)' }} />
          Correct! {target}
          <SpeakButton text={item.word} size="sm" />
        </div>
        <button
          onClick={handleNext}
          className="px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        >
          {current + 1 >= words.length ? 'View results' : 'Next'}
        </button>
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">
          Word {current + 1} / {words.length}
        </span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>
          Score: {score}
        </span>
      </div>

      {item.category && (
        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-display font-bold bg-(--bg-tertiary) text-(--text-muted) mb-3">
          {item.category}
        </span>
      )}

      <p className="text-(--text-secondary) mb-4 text-sm bg-(--bg-tertiary) p-4 rounded-xl border border-(--border-primary)">
        💡 <strong>Hint:</strong> {item.hint}
      </p>

      <div className="min-h-[52px] p-4 bg-(--bg-tertiary) rounded-2xl border-2 border-dashed border-(--border-secondary) mb-5 flex flex-wrap gap-2 items-center">
        {selected.length === 0 && (
          <span className="text-(--text-muted) text-sm">Click the letters in the correct order...</span>
        )}
        <AnimatePresence mode="popLayout">
          {selected.map((letter, i) => (
            <motion.span
              key={`${letter}-${i}`}
              initial={reducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-(--success-soft) border-2 border-(--success)/40 font-display font-bold text-lg text-(--text-primary)"
            >
              {letter}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Scrambled letters">
        {shuffled.map((letter, idx) => {
          const isDisabled = placedIndices.includes(idx)
          const isWrong = wrongIdx === idx
          return (
            <motion.button
              key={`${letter}-${idx}`}
              whileHover={!isDisabled && !reducedMotion ? { scale: 1.05 } : {}}
              whileTap={!isDisabled && !reducedMotion ? { scale: 0.95 } : {}}
              animate={isWrong && !reducedMotion ? { x: [0, -6, 6, -6, 0] } : {}}
              onClick={() => !isDisabled && handleLetterClick(letter, idx)}
              disabled={isDisabled}
              aria-label={`Letter ${letter}`}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-xl font-display font-bold text-lg transition-all',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                isDisabled
                  ? 'bg-(--success-soft) border-2 border-(--success)/30 text-(--text-muted) cursor-default'
                  : isWrong
                    ? 'bg-red-100 dark:bg-red-950/50 border-2 border-red-400 cursor-pointer'
                    : 'bg-(--bg-card) border-2 border-(--border-primary) text-(--text-primary) hover:border-(--accent) hover:bg-(--accent-soft) cursor-pointer'
              )}
            >
              {letter}
            </motion.button>
          )
        })}
      </div>

      <button
        onClick={handleClear}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-display font-bold text-(--text-muted) hover:bg-(--bg-tertiary) cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
      >
        <RotateCcw className="w-4 h-4" /> Clear
      </button>
    </div>
  )
}
