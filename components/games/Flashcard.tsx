import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import type { FlashcardData } from '../../types'
import type { FlashcardProgress } from '@/features/activities/snapshots/flashcard'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { flashcardCoverage } from '@/lib/games/scoring'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'
import { useReducedMotion } from '@/lib/motion/useReducedMotion'

interface FlashcardProps {
  cards: FlashcardData[]
  initialProgress?: FlashcardProgress
  onProgressChange?: (progress: FlashcardProgress) => void
  onComplete?: (result: { score: number; total: number; known: number }) => void
}

export default function Flashcard({ cards, initialProgress, onProgressChange, onComplete }: FlashcardProps) {
  const [current, setCurrent] = useState(initialProgress?.current ?? 0)
  const [flipped, setFlipped] = useState(initialProgress?.flipped ?? false)
  const [known, setKnown] = useState<Set<string>>(() => new Set(initialProgress?.knownIds ?? []))
  const [finished, setFinished] = useState(false)
  const reducedMotion = useReducedMotion()

  useDebouncedProgress(
    { current, flipped, knownIds: [...known] },
    onProgressChange,
    finished,
  )

  const card = cards[current]

  const handleNext = () => {
    setFlipped(false)
    if (current + 1 >= cards.length) {
      setFinished(true)
      const pct = flashcardCoverage(known.size, cards.length)
      onComplete?.({ score: pct, total: 100, known: known.size })
    } else {
      setCurrent((c) => c + 1)
    }
  }

  const handlePrev = () => {
    setFlipped(false)
    setCurrent((c) => Math.max(c - 1, 0))
  }

  const handleMarkKnown = () => {
    setKnown((prev) => new Set([...prev, card.id]))
    handleNext()
  }

  const handleReset = () => {
    setCurrent(0)
    setFlipped(false)
    setKnown(new Set())
    setFinished(false)
  }

  if (finished) return null

  return (
    <div className="max-w-md mx-auto space-y-5" role="region" aria-label="Vocabulary flashcards">
      <div className="flex items-center justify-between text-sm">
        <span className="font-display font-bold text-(--text-muted)">{current + 1} / {cards.length}</span>
        <span className="font-display font-bold" style={{ color: 'var(--success)' }}>{known.size} known</span>
      </div>

      <div style={{ perspective: '1000px' }}>
        <motion.button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          aria-label={flipped ? 'Flip to front' : 'Flip to back'}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
          className="relative h-56 w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 rounded-3xl bg-(--bg-card) border-2 border-(--border-primary) shadow-lg flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden' }}>
            <p className="text-[10px] font-display font-bold text-(--text-muted) mb-3 uppercase tracking-widest">Front</p>
            <p className="text-2xl font-display font-black text-(--text-primary) text-center">{card.front}</p>
            <p className="text-xs text-(--text-muted) mt-5">Press Enter or Space to flip</p>
          </div>
          <div className="absolute inset-0 rounded-3xl bg-(--secondary-soft) border-2 border-(--secondary)/20 shadow-lg flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-[10px] font-display font-bold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>Back</p>
            <p className="text-xl font-display font-bold text-(--text-primary) text-center mt-3">{card.back}</p>
            {card.example && <p className="text-sm text-(--text-secondary) mt-4 italic text-center">&quot;{card.example}&quot;</p>}
          </div>
        </motion.button>
      </div>
      <div className="flex justify-center"><SpeakButton text={flipped ? card.example ?? card.back : card.front} label={flipped ? `Pronounce ${card.back}` : `Pronounce ${card.front}`} /></div>

      <div className="flex items-center justify-between">
        <button onClick={handlePrev} disabled={current === 0} aria-label="Previous"
          className="p-2.5 rounded-xl hover:bg-(--bg-tertiary) disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)">
          <ArrowLeft className="w-5 h-5 text-(--text-secondary)" />
        </button>
        <div className="flex gap-2">
          <button onClick={handleMarkKnown}
            className="px-4 py-2 rounded-xl border-2 text-sm font-display font-bold cursor-pointer hover:opacity-80 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--success)"
            style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
            ✓ I know it
          </button>
          <button onClick={handleReset} aria-label="Reset"
            className="p-2.5 rounded-xl hover:bg-(--bg-tertiary) cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)">
            <RotateCcw className="w-4 h-4 text-(--text-muted)" />
          </button>
        </div>
        <button onClick={handleNext} disabled={current >= cards.length - 1} aria-label="Next"
          className="p-2.5 rounded-xl hover:bg-(--bg-tertiary) disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)">
          <ArrowRight className="w-5 h-5 text-(--text-secondary)" />
        </button>
      </div>
      <p className="sr-only" aria-live="polite">Card {current + 1} of {cards.length}. {flipped ? 'Back shown.' : 'Front shown.'} {known.size} known.</p>
    </div>
  )
}
