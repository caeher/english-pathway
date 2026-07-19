'use client'

import { useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle, RotateCcw } from 'lucide-react'
import type { MatchPair, SentenceChallenge } from '@/types'
import { shuffleArray, cn } from '@/lib/helpers'
import ActivityResult from './ActivityResult'
import { scoreToPercent } from '@/lib/games/scoring'

interface DragDropProps {
  mode: 'match' | 'sentence'
  pairs?: MatchPair[]
  sentences?: SentenceChallenge[]
  onComplete?: (result: { score: number; total: number }) => void
}

export default function DragDrop({ mode, pairs = [], sentences = [], onComplete }: DragDropProps) {
  if (mode === 'sentence') {
    return <SentenceDragDrop sentences={sentences} onComplete={onComplete} />
  }
  return <MatchDragDrop pairs={pairs} onComplete={onComplete} />
}

function MatchDragDrop({
  pairs,
  onComplete,
}: {
  pairs: MatchPair[]
  onComplete?: (result: { score: number; total: number }) => void
}) {
  const [dragItem, setDragItem] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<number, string>>({})
  const [wrongSlot, setWrongSlot] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [selectedLeftIdx, setSelectedLeftIdx] = useState<number | null>(null)
  const [selectedRightText, setSelectedRightText] = useState<string | null>(null)

  const shuffledRight = useMemo(
    () => shuffleArray(pairs.map((p) => p.right)),
    [pairs]
  )

  const handleDrop = (leftIdx: number, rightText: string) => {
    const expected = pairs[leftIdx].right
    if (rightText === expected) {
      setMatches((m) => ({ ...m, [leftIdx]: rightText }))
    } else {
      setWrongSlot(leftIdx)
      setTimeout(() => setWrongSlot(null), 500)
    }
    setDragItem(null)
  }

  const matchedCount = Object.keys(matches).length
  const allDone = matchedCount === pairs.length

  const handleFinish = () => {
    setFinished(true)
    const pct = scoreToPercent(matchedCount, pairs.length)
    onComplete?.({ score: pct, total: 100 })
  }

  const handleRestart = () => {
    setMatches({})
    setFinished(false)
    setSelectedLeftIdx(null)
    setSelectedRightText(null)
  }

  const selectLeft = (i: number) => {
    if (matches[i]) return
    if (selectedRightText !== null) {
      handleDrop(i, selectedRightText)
      setSelectedLeftIdx(null)
      setSelectedRightText(null)
    } else {
      setSelectedLeftIdx((prev) => (prev === i ? null : i))
    }
  }

  const selectRight = (text: string) => {
    if (usedRights.has(text)) return
    if (selectedLeftIdx !== null) {
      handleDrop(selectedLeftIdx, text)
      setSelectedLeftIdx(null)
      setSelectedRightText(null)
    } else {
      setSelectedRightText((prev) => (prev === text ? null : text))
    }
  }

  const handleLeftKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      selectLeft(i)
    }
  }

  const handleRightKeyDown = (e: React.KeyboardEvent, text: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      selectRight(text)
    }
  }

  const usedRights = new Set(Object.values(matches))

  if (finished) {
    const pct = scoreToPercent(matchedCount, pairs.length)
    return <ActivityResult percent={pct} score={matchedCount} total={pairs.length} onRetry={handleRestart} />
  }

  return (
    <div role="region" aria-label="Match by dragging or selecting">
      <p className="text-sm text-(--text-muted) mb-4">
        Drag each translation to its English word, or use Tab then Enter or Space to select both items ({matchedCount}/{pairs.length})
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2" role="group" aria-label="English words and slots">
          {pairs.map((p, i) => (
            <div
              key={`left-${i}`}
              tabIndex={matches[i] ? -1 : 0}
              role="button"
              aria-label={matches[i] ? `Word ${p.left} matched with ${matches[i]}` : `Slot for ${p.left}`}
              aria-pressed={selectedLeftIdx === i}
              onClick={() => selectLeft(i)}
              onKeyDown={(e) => handleLeftKeyDown(e, i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const text = e.dataTransfer.getData('text/plain')
                handleDrop(i, text)
              }}
              className={cn(
                'min-h-[48px] px-3.5 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) cursor-pointer',
                matches[i]
                  ? 'border-(--success)/40 bg-(--success-soft)'
                  : wrongSlot === i
                    ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
                    : selectedLeftIdx === i
                      ? 'border-(--accent) bg-(--accent-soft) ring-2 ring-(--accent)/30'
                      : 'border-(--border-secondary) bg-(--bg-tertiary)'
              )}
            >
              {matches[i] ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  {p.left} → {matches[i]}
                </span>
              ) : (
                <span>{p.left}</span>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-2" role="group" aria-label="Available translations">
          {shuffledRight.map((text) => {
            const used = usedRights.has(text)
            return (
              <div
                key={text}
                draggable={!used}
                onDragStart={(e) => {
                  setDragItem(text)
                  e.dataTransfer.setData('text/plain', text)
                }}
                onDragEnd={() => setDragItem(null)}
                onClick={() => selectRight(text)}
                onKeyDown={(e) => handleRightKeyDown(e, text)}
                className={cn(
                  'px-3.5 py-3 rounded-xl border-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                  used
                    ? 'opacity-30 border-(--border-primary) cursor-default'
                    : dragItem === text || selectedRightText === text
                      ? 'border-(--accent) bg-(--accent-soft) ring-2 ring-(--accent)/30 cursor-grabbing'
                      : 'border-(--border-primary) bg-(--bg-card) cursor-grab hover:border-(--accent)/50'
                )}
                role="button"
                tabIndex={used ? -1 : 0}
                aria-grabbed={dragItem === text}
                aria-pressed={selectedRightText === text}
              >
                {text}
              </div>
            )
          })}
        </div>
      </div>
      {allDone && (
        <button
          type="button"
          onClick={handleFinish}
          className="mt-5 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold cursor-pointer"
        >
          Finish
        </button>
      )}
      <p className="sr-only" aria-live="polite">{wrongSlot !== null ? 'Incorrect match. Select another translation.' : `${matchedCount} of ${pairs.length} pairs matched.`}</p>
    </div>
  )
}

function SentenceDragDrop({
  sentences,
  onComplete,
}: {
  sentences: SentenceChallenge[]
  onComplete?: (result: { score: number; total: number }) => void
}) {
  const [current, setCurrent] = useState(0)
  const [placed, setPlaced] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [dragWord, setDragWord] = useState<string | null>(null)

  const shouldReduceMotion = useReducedMotion()
  const initialScale = shouldReduceMotion ? 1 : 0.9

  const sentence = sentences[current]
  const shuffled = useMemo(() => shuffleArray([...sentence.words]), [sentence])

  const available = shuffled.filter((w) => !placed.includes(w) || placed.filter((p) => p === w).length < sentence.words.filter((x) => x === w).length)

  const handleAddWord = (word: string) => {
    setPlaced((p) => [...p, word])
  }

  const handleAddWordKeyDown = (e: React.KeyboardEvent, word: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleAddWord(word)
    }
  }

  const handleRemoveWord = (index: number) => {
    setPlaced((p) => p.filter((_, idx) => idx !== index))
  }

  const handleRemoveWordKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRemoveWord(index)
    }
  }

  const handleCheck = () => {
    const built = placed.join(' ')
    if (built === sentence.correct) setScore((s) => s + 1)
    if (current + 1 >= sentences.length) {
      setFinished(true)
      const finalScore = built === sentence.correct ? score + 1 : score
      const pct = scoreToPercent(finalScore, sentences.length)
      onComplete?.({ score: pct, total: 100 })
    } else {
      setCurrent((c) => c + 1)
      setPlaced([])
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setPlaced([])
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = scoreToPercent(score, sentences.length)
    return <ActivityResult percent={pct} score={score} total={sentences.length} onRetry={handleRestart} />
  }

  return (
    <div role="region" aria-label="Build a sentence by dragging or selecting">
      <p className="mb-3 text-sm text-(--text-muted)">Use Tab then Enter or Space to add and remove words. Dragging is optional.</p>
      {sentence.prompt && (
        <p className="text-sm text-(--text-secondary) mb-4 italic">&quot;{sentence.prompt}&quot;</p>
      )}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const word = e.dataTransfer.getData('text/plain')
          setPlaced((p) => [...p, word])
          setDragWord(null)
        }}
        className="min-h-[56px] p-4 bg-(--bg-tertiary) rounded-2xl border-2 border-dashed border-(--border-secondary) mb-5 flex flex-wrap gap-2"
        role="group"
        aria-label="Sentence in progress"
      >
        {placed.length === 0 && (
          <span className="text-(--text-muted) text-sm">Drag words here or select them below...</span>
        )}
        {placed.map((w, i) => (
          <motion.button
            key={`${w}-${i}`}
            initial={{ scale: initialScale }}
            animate={{ scale: 1 }}
            onClick={() => handleRemoveWord(i)}
            onKeyDown={(e) => handleRemoveWordKeyDown(e, i)}
            type="button"
            className="px-3 py-2 rounded-xl bg-(--accent-soft) text-(--accent) border border-(--accent)/30 font-display font-bold text-sm cursor-pointer hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
            aria-label={`Remove word ${w}`}
          >
            {w}
          </motion.button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Available words">
        {available.map((word, idx) => (
          <div
            key={`${word}-${idx}`}
            draggable
            onDragStart={(e) => {
              setDragWord(word)
              e.dataTransfer.setData('text/plain', word)
            }}
            onDragEnd={() => setDragWord(null)}
            onClick={() => handleAddWord(word)}
            onKeyDown={(e) => handleAddWordKeyDown(e, word)}
            className={cn(
              'px-3.5 py-2 rounded-xl border-2 font-display font-bold text-sm cursor-grab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
              dragWord === word
                ? 'border-(--accent) bg-(--accent-soft)'
                : 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
            )}
            tabIndex={0}
            role="button"
            aria-label={`Add word ${word}`}
          >
            {word}
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setPlaced([])}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-display font-bold text-(--text-muted) hover:bg-(--bg-tertiary) cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Clear
        </button>
        <button
          type="button"
          onClick={handleCheck}
          disabled={placed.length === 0}
          className="px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold disabled:opacity-50 cursor-pointer"
        >
          {current + 1 >= sentences.length ? 'View results' : 'Check and next'}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">Sentence {current + 1} of {sentences.length}. {placed.length} words selected.</p>
    </div>
  )
}
