import { useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { RotateCcw, CheckCircle } from 'lucide-react'
import type { MatchPair } from '../../types'
import type { WordMatchProgress } from '@/features/activities/snapshots/word-match'
import { shuffleArray, cn } from '@/lib/helpers'
import { SpeakButton } from '@/components/ui/SpeakButton'
import ActivityResult from './ActivityResult'
import { wordMatchAccuracy } from '@/lib/games/scoring'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'

interface WordMatchProps {
  pairs: MatchPair[]
  initialProgress?: WordMatchProgress
  onProgressChange?: (progress: WordMatchProgress) => void
  onComplete?: (result: { score: number; total: number; attempts: number; pairCount: number }) => void
}

function buildMatchedSet(leftIndices: number[], shuffledRight: { originalIdx: number }[]): Set<string> {
  const matched = new Set<string>()
  for (const leftIdx of leftIndices) {
    const rightIdx = shuffledRight.findIndex((item) => item.originalIdx === leftIdx)
    if (rightIdx >= 0) matched.add(`${leftIdx}-${rightIdx}`)
  }
  return matched
}

export default function WordMatch({ pairs, initialProgress, onProgressChange, onComplete }: WordMatchProps) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const shuffledRight = useMemo(() => shuffleArray(pairs.map((p, idx) => ({ text: p.right, originalIdx: idx }))), [pairs])
  const [matched, setMatched] = useState<Set<string>>(() =>
    buildMatchedSet(initialProgress?.matchedLeftIndices ?? [], shuffledRight),
  )
  const [wrong, setWrong] = useState<{ left: number; right: number } | null>(null)
  const [attempts, setAttempts] = useState(initialProgress?.attempts ?? 0)
  const [finished, setFinished] = useState(false)

  const shouldReduceMotion = useReducedMotion()

  const matchedLeftIndices = useMemo(
    () => [...matched].map((key) => Number(key.split('-')[0])),
    [matched],
  )

  useDebouncedProgress(
    { matchedLeftIndices, attempts },
    onProgressChange,
    finished,
  )
  const allMatched = matched.size === pairs.length

  const checkMatch = (leftIdx: number, rightIdx: number) => {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    const rightItem = shuffledRight[rightIdx]
    if (leftIdx === rightItem.originalIdx) {
      const matchKey = `${leftIdx}-${rightIdx}`
      const newMatched = new Set([...matched, matchKey])
      setMatched(newMatched)
      setSelectedLeft(null)
      setSelectedRight(null)
      if (newMatched.size === pairs.length) {
        setFinished(true)
        const pct = wordMatchAccuracy(newAttempts, pairs.length)
        onComplete?.({ score: pct, total: 100, attempts: newAttempts, pairCount: pairs.length })
      }
    } else {
      setWrong({ left: leftIdx, right: rightIdx })
      setTimeout(() => { setSelectedLeft(null); setSelectedRight(null); setWrong(null) }, 700)
    }
  }

  const handleLeft = (i: number) => {
    const isMatched = Array.from(matched).some(key => key.startsWith(`${i}-`))
    if (isMatched) return
    setSelectedLeft(i)
    setWrong(null)
    if (selectedRight !== null) checkMatch(i, selectedRight)
  }

  const handleRight = (i: number) => {
    const isMatched = Array.from(matched).some(key => key.endsWith(`-${i}`))
    if (isMatched) return
    setSelectedRight(i)
    setWrong(null)
    if (selectedLeft !== null) checkMatch(selectedLeft, i)
  }

  const handleKeyDown = (e: React.KeyboardEvent, side: 'left' | 'right', i: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (side === 'left') handleLeft(i)
      else handleRight(i)
    }
  }

  const handleRestart = () => {
    setMatched(new Set())
    setAttempts(0)
    setFinished(false)
    setSelectedLeft(null)
    setSelectedRight(null)
  }

  if (finished) {
    const pct = wordMatchAccuracy(attempts, pairs.length)
    return (
      <ActivityResult
        percent={pct}
        subtitle={`${attempts} attempts · ${pairs.length} pairs`}
        onRetry={handleRestart}
      />
    )
  }

  return (
    <div role="region" aria-label="Match words">
      <div className="flex justify-between text-sm font-display font-bold text-(--text-muted) mb-4">
        <span>Matched: {matched.size}/{pairs.length}</span>
        <span>Attempts: {attempts}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2" role="group" aria-label="English words">
          {pairs.map((p, i) => {
            const isMatched = Array.from(matched).some(key => key.startsWith(`${i}-`))
            const isSel = selectedLeft === i
            const isWrong = wrong?.left === i
            return (
              <div key={`l-${i}`} className="flex items-center gap-2">
              <motion.button onClick={() => handleLeft(i)}
                onKeyDown={(e) => handleKeyDown(e, 'left', i)}
                animate={isWrong && !shouldReduceMotion ? { x: [0, -6, 6, -6, 0] } : {}}
                aria-pressed={isSel}
                className={cn('min-w-0 flex-1 px-3.5 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                  isMatched ? 'border-(--success)/40 bg-(--success-soft)' :
                  isWrong ? 'border-red-400 bg-red-50 dark:bg-red-950/30' :
                  isSel ? 'border-(--accent) bg-(--accent-soft) shadow-sm' :
                  'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50')}>
                <span className="flex items-center gap-2">
                  {isMatched && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--success)' }} />}
                  {p.left}
                </span>
              </motion.button>
              <SpeakButton text={p.left.replace(/[^\w\s]/g, '').trim() || p.left} size="sm" />
              </div>
            )
          })}
        </div>
        <div className="space-y-2" role="group" aria-label="Translations">
          {shuffledRight.map((item, i) => {
            const isMatched = Array.from(matched).some(key => key.endsWith(`-${i}`))
            const isSel = selectedRight === i
            const isWrong = wrong?.right === i
            return (
              <motion.button key={`r-${i}`} onClick={() => handleRight(i)}
                onKeyDown={(e) => handleKeyDown(e, 'right', i)}
                animate={isWrong && !shouldReduceMotion ? { x: [0, 6, -6, 6, 0] } : {}}
                aria-pressed={isSel}
                className={cn('w-full px-3.5 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                  isMatched ? 'border-(--success)/40 bg-(--success-soft)' :
                  isWrong ? 'border-red-400 bg-red-50 dark:bg-red-950/30' :
                  isSel ? 'border-(--secondary) bg-(--secondary-soft) shadow-sm' :
                  'border-(--border-primary) bg-(--bg-card) hover:border-(--secondary)/50')}>
                {isMatched && <CheckCircle className="inline w-4 h-4 mr-1.5" style={{ color: 'var(--success)' }} />}
                {item.text}
              </motion.button>
            )
          })}
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {wrong && 'Incorrect match. Choose another pair.'}
        {allMatched && 'All pairs matched.'}
        {!wrong && !allMatched && `Matched ${matched.size} of ${pairs.length}. Attempts ${attempts}.`}
      </div>
    </div>
  )
}
