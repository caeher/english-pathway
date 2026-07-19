import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import type { SentenceChallenge } from '../../types'
import { shuffleArray } from '@/lib/helpers'
import ActivityResult from './ActivityResult'
import { scoreToPercent } from '@/lib/games/scoring'

interface SentenceBuilderProps {
  sentences: SentenceChallenge[]
  onComplete?: (result: { score: number; total: number }) => void
}

export default function SentenceBuilder({ sentences, onComplete }: SentenceBuilderProps) {
  const [current, setCurrent] = useState(0)
  const [placed, setPlaced] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const sentence = sentences[current]
  const words = useMemo(() => shuffleArray(sentence.words.map((w, idx) => ({ text: w, id: idx }))), [sentence])
  const available = words.filter((w) => !placed.includes(w.id))

  const handlePlace = (wordId: number) => {
    if (checked) return
    setPlaced((p) => [...p, wordId])
  }

  const handleRemove = (index: number) => {
    if (checked) return
    setPlaced((p) => p.filter((_, i) => i !== index))
  }

  const handleKeyPlace = (e: React.KeyboardEvent, wordId: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePlace(wordId)
    }
  }

  const handleCheck = () => {
    const builtSentence = placed.map(id => sentence.words[id]).join(' ')
    const correct = builtSentence === sentence.correct
    setChecked(true)
    setIsCorrect(correct)
    if (correct) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (current + 1 >= sentences.length) {
      setFinished(true)
      const finalScore = score
      const pct = scoreToPercent(finalScore, sentences.length)
      onComplete?.({ score: pct, total: 100 })
      return
    }
    setCurrent((c) => c + 1)
    setPlaced([])
    setChecked(false)
    setIsCorrect(false)
  }

  const handleRestart = () => {
    setCurrent(0)
    setPlaced([])
    setChecked(false)
    setIsCorrect(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = scoreToPercent(score, sentences.length)
    return (
      <ActivityResult percent={pct} score={score} total={sentences.length} onRetry={handleRestart} />
    )
  }

  return (
    <div className="max-w-2xl mx-auto" role="region" aria-label="Build sentences">
      <p className="mb-3 text-sm text-(--text-muted)">Use Tab, Enter, or Space to add words. Select a placed word to remove it.</p>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">Sentence {current + 1} / {sentences.length}</span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>Score: {score}</span>
      </div>

      {sentence.prompt && (
        <p className="text-(--text-secondary) mb-4 italic text-sm bg-(--bg-tertiary) p-4 rounded-xl">&quot;{sentence.prompt}&quot;</p>
      )}

      <div className="min-h-[56px] p-4 bg-(--bg-tertiary) rounded-2xl border-2 border-dashed border-(--border-secondary) mb-5 flex flex-wrap gap-2"
        role="group" aria-label="Built sentence">
        {placed.length === 0 && <span className="text-(--text-muted) text-sm">Click words to build the sentence...</span>}
        <AnimatePresence>
          {placed.map((wordId, i) => (
            <motion.button key={`placed-${wordId}-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              onClick={() => handleRemove(i)}
              className={`px-3.5 py-2 rounded-xl font-display font-bold text-sm cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) ${
                checked ? (isCorrect ? 'bg-(--success-soft) border border-(--success)/30' : 'bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700')
                : 'bg-(--accent-soft) text-(--accent) border border-(--accent)/30 hover:opacity-80'}`}>
              {sentence.words[wordId]}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Available words">
        {available.map((item) => (
          <motion.button key={`avail-${item.id}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handlePlace(item.id)}
            onKeyDown={(e) => handleKeyPlace(e, item.id)}
            className="px-3.5 py-2 rounded-xl bg-(--bg-card) border-2 border-(--border-primary) font-display font-bold text-sm text-(--text-secondary) hover:border-(--accent) hover:bg-(--accent-soft) cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)">
            {item.text}
          </motion.button>
        ))}
      </div>

      {checked && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-4 rounded-xl mb-4 text-sm font-display font-bold ${isCorrect ? 'bg-(--success-soft) border border-(--success)/20' : 'bg-red-50 dark:bg-red-950/30 border border-red-300/20'}`}
          role="status" aria-live="polite">
          {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-medium">{isCorrect ? 'Correct!' : `Answer: "${sentence.correct}"`}</span>
        </motion.div>
      )}

      <div className="flex gap-3">
        {!checked && (
          <>
            <button onClick={() => setPlaced([])} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-display font-bold text-(--text-muted) hover:bg-(--bg-tertiary) cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)">
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
            <button onClick={handleCheck} disabled={placed.length === 0}
              className="px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)">
              Check
            </button>
          </>
        )}
        {checked && (
          <button onClick={handleNext} className="px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-display font-bold hover:opacity-90 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)">
            {current + 1 >= sentences.length ? 'View results' : 'Next'}
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">Sentence {current + 1} of {sentences.length}. {placed.length} words selected.{checked ? isCorrect ? ' Correct.' : ` Incorrect. Answer: ${sentence.correct}.` : ''}</p>
    </div>
  )
}
