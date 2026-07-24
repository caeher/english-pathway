import { useCallback, useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { FlashcardData } from '../../types'
import type { FlashcardProgress } from '@/features/activities/snapshots/flashcard'
import { Button } from '@/components/ui/button'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { buildFlashcardRecallResult, type CardGrade } from '@/lib/games/flashcard-recall'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

interface FlashcardProps {
  cards: FlashcardData[]
  initialProgress?: FlashcardProgress
  onProgressChange?: (progress: FlashcardProgress) => void
  onComplete?: (result: {
    score: number
    total: number
    scorePercent: number
    weakItemIndexes: number[]
    metrics: { recalled: number; unsure: number; missed: number }
  }) => void
}

const gradeButtons: { grade: CardGrade; label: string; variant: 'reward' | 'outline' | 'destructive' }[] = [
  { grade: 'recalled', label: 'I recalled it', variant: 'reward' },
  { grade: 'unsure', label: 'Not sure', variant: 'outline' },
  { grade: 'missed', label: "Couldn't recall", variant: 'destructive' },
]

export default function Flashcard({ cards, initialProgress, onProgressChange, onComplete }: FlashcardProps) {
  const [current, setCurrent] = useState(initialProgress?.current ?? 0)
  const [revealed, setRevealed] = useState(initialProgress?.revealed ?? false)
  const [answered, setAnswered] = useState(initialProgress?.answered ?? false)
  const [cardGrades, setCardGrades] = useState<Record<string, CardGrade>>(() => initialProgress?.cardGrades ?? {})
  const [weakItemIndexes, setWeakItemIndexes] = useState<number[]>(() => initialProgress?.weakItemIndexes ?? [])
  const [finished, setFinished] = useState(false)
  const reducedMotion = useReducedMotion()

  const card = cards[current]
  const cardIds = cards.map((c) => c.id)

  const buildProgress = useCallback((): FlashcardProgress => ({
    current,
    revealed,
    answered,
    cardGrades,
    weakItemIndexes,
  }), [answered, cardGrades, current, revealed, weakItemIndexes])

  useDebouncedProgress(buildProgress(), onProgressChange, finished)

  const finishActivity = useCallback((grades: Record<string, CardGrade>, weak: number[]) => {
    setFinished(true)
    const result = buildFlashcardRecallResult(cardIds, grades)
    onComplete?.({ ...result, weakItemIndexes: weak })
  }, [cardIds, onComplete])

  const advanceAfterGrade = useCallback((grade: CardGrade) => {
    const nextGrades = { ...cardGrades, [card.id]: grade }
    const isWeak = grade === 'unsure' || grade === 'missed'
    const nextWeak = isWeak ? [...weakItemIndexes, current] : weakItemIndexes

    setCardGrades(nextGrades)
    setWeakItemIndexes(nextWeak)
    setAnswered(true)

    if (current + 1 >= cards.length) {
      finishActivity(nextGrades, nextWeak)
      return
    }

    setTimeout(() => {
      setCurrent((c) => c + 1)
      setRevealed(false)
      setAnswered(false)
    }, 0)
  }, [card.id, cardGrades, cards.length, current, finishActivity, weakItemIndexes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (finished) return
      if (!revealed && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        setRevealed(true)
        return
      }
      if (revealed && !answered) {
        const gradeIndex = event.key === '1' ? 0 : event.key === '2' ? 1 : event.key === '3' ? 2 : -1
        if (gradeIndex >= 0) {
          event.preventDefault()
          advanceAfterGrade(gradeButtons[gradeIndex].grade)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [advanceAfterGrade, answered, finished, revealed])

  if (finished) return null

  const recalledCount = Object.values(cardGrades).filter((g) => g === 'recalled').length

  return (
    <div className="mx-auto max-w-md space-y-5" role="region" aria-label="Vocabulary flashcards">
      <div className="flex items-center justify-between text-sm">
        <span className="font-display font-bold text-(--text-muted)">{current + 1} / {cards.length}</span>
        <span className="font-display font-bold" style={{ color: 'var(--success)' }}>{recalledCount} recalled</span>
      </div>

      <article
        className="rounded-3xl border-2 border-(--border-primary) bg-(--bg-card) p-8 shadow-lg"
        style={{ transition: reducedMotion ? undefined : 'box-shadow 200ms ease' }}
      >
        <p className="text-[10px] font-display font-bold uppercase tracking-widest text-(--text-muted)">Recall</p>
        <p className="mt-3 text-center text-2xl font-display font-black text-(--text-primary)">{card.front}</p>
        <div className="mt-5 flex justify-center">
          <SpeakButton text={card.front} label={`Pronounce ${card.front}`} />
        </div>

        {!revealed ? (
          <Button className="mt-8 w-full" onClick={() => setRevealed(true)}>
            Show answer <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="mt-8 border-t border-(--border-primary) pt-6">
            <p className="text-xs font-display font-bold uppercase tracking-widest text-(--secondary)">Answer</p>
            <p className="mt-2 text-center text-xl font-display font-bold text-(--text-primary)">{card.back}</p>
            {card.example && (
              <p className="mt-3 text-center text-sm italic text-(--text-secondary)">&quot;{card.example}&quot;</p>
            )}
            <div className="mt-4 flex justify-center">
              <SpeakButton text={card.example ?? card.back} label={`Pronounce ${card.back}`} />
            </div>
            <div className="mt-6 grid gap-2">
              {gradeButtons.map((btn, index) => (
                <Button
                  key={btn.grade}
                  variant={btn.variant}
                  size="sm"
                  disabled={answered}
                  onClick={() => advanceAfterGrade(btn.grade)}
                  aria-keyshortcuts={`${index + 1}`}
                >
                  <span className="mr-2 font-mono text-xs opacity-60">{index + 1}</span>
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </article>

      <p className="sr-only" aria-live="polite">
        Card {current + 1} of {cards.length}.
        {revealed ? ' Answer shown. Rate your recall.' : ' Try to recall the answer before revealing.'}
        {recalledCount} recalled so far.
      </p>
    </div>
  )
}
