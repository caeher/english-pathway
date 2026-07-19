import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import type { QuizQuestion, QuizResult } from '../../types'
import { cn } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import ActivityResult from './ActivityResult'
import { scoreToPercent } from '@/lib/games/scoring'

interface QuizProps {
  questions: QuizQuestion[]
  onComplete?: (result: QuizResult & { scorePercent: number }) => void
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [fillValue, setFillValue] = useState('')
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [wrongExplanations, setWrongExplanations] = useState<string[]>([])

  const q = questions[current]

  const handleMCSelect = (index: number) => {
    if (answered || q.type !== 'multiple-choice') return
    setSelected(index)
    setAnswered(true)
    const correct = index === q.correct
    setIsCorrect(correct)
    if (correct) setScore((s) => s + 1)
    else if (q.explanation) setWrongExplanations((e) => [...e, q.explanation!])
  }

  const handleFillSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (answered || q.type !== 'fill-blank' || !fillValue.trim()) return
    setAnswered(true)
    const correct = fillValue.trim().toLowerCase() === q.correct.toLowerCase()
    setIsCorrect(correct)
    if (correct) setScore((s) => s + 1)
    else {
      const exp = q.explanation ?? `The correct answer is "${q.correct}"`
      setWrongExplanations((e) => [...e, exp])
    }
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true)
      const pct = scoreToPercent(score, questions.length)
      onComplete?.({ score, total: questions.length, scorePercent: pct })
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
      setFillValue('')
      setAnswered(false)
      setIsCorrect(false)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected(null)
    setFillValue('')
    setAnswered(false)
    setIsCorrect(false)
    setScore(0)
    setFinished(false)
    setWrongExplanations([])
  }

  if (finished) {
    const pct = scoreToPercent(score, questions.length)
    return (
      <ActivityResult
        percent={pct}
        score={score}
        total={questions.length}
        explanations={wrongExplanations}
        onRetry={handleRestart}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto" role="region" aria-label="Quiz">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-display font-bold text-(--text-muted)">Question {current + 1} / {questions.length}</span>
        <span className="text-sm font-display font-bold" style={{ color: 'var(--reward)' }}>Score: {score}</span>
      </div>
      <Progress value={((current + 1) / questions.length) * 100} className="mb-6" />

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <h3 className="font-display text-lg font-bold text-(--text-primary) mb-5">{q.question}</h3>

          {q.type === 'multiple-choice' && (
            <div className="space-y-3" role="radiogroup" aria-label="Options. Select one answer to submit it.">
              {q.options.map((opt, i) => {
                const isRight = i === q.correct
                const isSel = i === selected
                let cls = 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'
                if (answered) {
                  if (isRight) cls = 'border-(--success)/50 bg-(--success-soft)'
                  else if (isSel) cls = 'border-red-400 bg-red-50 dark:bg-red-950/30'
                  else cls = 'border-(--border-primary) bg-(--bg-tertiary) opacity-40'
                }
                return (
                  <button key={i} onClick={() => handleMCSelect(i)} disabled={answered}
                    role="radio"
                    aria-checked={isSel}
                    className={cn('w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)', cls)}>
                    <span className="w-7 h-7 rounded-lg border-2 border-current flex items-center justify-center text-xs font-display font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-medium text-sm">{opt}</span>
                    {answered && isRight && <CheckCircle className="w-5 h-5 ml-auto" style={{ color: 'var(--success)' }} />}
                    {answered && isSel && !isRight && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                  </button>
                )
              })}
            </div>
          )}

          {q.type === 'fill-blank' && (
            <form onSubmit={handleFillSubmit} className="space-y-3">
              <label htmlFor="quiz-fill" className="sr-only">Your answer</label>
              <input id="quiz-fill" type="text" value={fillValue} onChange={(e) => setFillValue(e.target.value)} disabled={answered} placeholder="Type your answer..."
                className={cn('w-full px-4 py-3.5 rounded-2xl border-2 text-lg outline-none transition-colors font-display focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
                  answered ? (isCorrect ? 'border-(--success)/50 bg-(--success-soft)' : 'border-red-400 bg-red-50 dark:bg-red-950/30') : 'border-(--border-primary) bg-(--bg-card) focus:border-(--accent)')} />
              {!answered && (
                <Button type="submit" disabled={!fillValue.trim()} size="md">Submit</Button>
              )}
              {answered && !isCorrect && q.type === 'fill-blank' && (
                <p className="text-sm text-red-600 font-medium">Answer: &quot;{q.correct}&quot;</p>
              )}
            </form>
          )}

          {answered && q.explanation && isCorrect && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-(--secondary-soft) border border-(--secondary)/20 rounded-xl text-sm text-(--text-secondary)">
              💡 {q.explanation}
            </motion.div>
          )}

          {answered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex justify-end">
              <Button onClick={handleNext} size="md">
                {current + 1 >= questions.length ? 'View results' : 'Next'} <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sr-only" aria-live="polite">
        {answered && (isCorrect ? 'Correct answer.' : 'Incorrect answer.')}
      </div>
    </div>
  )
}
