'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import { selectClearPanel, selectPanel, useLearnSessionStore } from '@/stores/useLearnSessionStore'
import { MarkdownWithTts } from '@/components/lesson/MarkdownWithTts'
import ActivityRenderer, { type ActivityCompleteResult } from './ActivityRenderer'
import { Button } from '@/components/ui/button'
import { panelTransition } from '@/lib/motion/system'
import { motionProps, useReducedMotion } from '@/lib/motion/useReducedMotion'
import type { ActivityUiPhase } from '@/lib/learn/session-ui-state'
import { cn } from '@/lib/helpers'

interface DynamicContentPanelProps {
  onActivityComplete?: (result: ActivityCompleteResult) => void
  onActivityDifficult?: (activityId: string, context?: import('@/features/activities/hints').TutorHintContext) => void
  onQuestionAnswered?: (optionIndex: number, correct: boolean) => void
  onActivityPhaseChange?: (phase: ActivityUiPhase) => void
}

export default function DynamicContentPanel({
  onActivityComplete,
  onActivityDifficult,
  onQuestionAnswered,
  onActivityPhaseChange,
}: DynamicContentPanelProps) {
  const panel = useLearnSessionStore(selectPanel)
  const clearPanel = useLearnSessionStore(selectClearPanel)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const reducedMotion = useReducedMotion()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const questionPrompt = panel.kind === 'question' ? panel.prompt : null

  useEffect(() => {
    if (panel.kind !== 'empty') headingRef.current?.focus({ preventScroll: window.innerWidth >= 1024 })
  }, [panel.kind])

  useEffect(() => {
    if (panel.kind === 'question') setSelectedOption(null)
  }, [panel.kind, questionPrompt])

  if (panel.kind === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-8">
        <p className="text-(--text-muted) text-sm max-w-sm">
          Your lesson content will appear here — grammar explanations, quizzes, and interactive
          activities guided by the AI tutor.
        </p>
      </div>
    )
  }

  const handleQuestionSelect = (index: number) => {
    if (selectedOption !== null || panel.kind !== 'question') return
    setSelectedOption(index)
    const correct = panel.correctIndex !== undefined ? index === panel.correctIndex : false
    onQuestionAnswered?.(index, correct)
  }

  return (
    <div className="flex min-h-full flex-col" aria-live="polite">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-(--border-primary)">
        <h2 ref={headingRef} tabIndex={-1} className="min-w-0 flex-1 truncate font-display font-bold text-(--text-primary) text-sm focus:outline-none">
          {panel.kind === 'grammar' && (panel.title ?? 'Lesson')}
          {panel.kind === 'activity' && panel.activity.title}
          {panel.kind === 'question' && 'Quick check'}
        </h2>
        {panel.kind !== 'activity' && (
          <Button variant="ghost" size="sm" onClick={clearPanel}>
            Close
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={panel.kind === 'activity' ? `activity-${panel.activity.id}` : panel.kind}
          className="flex-1 overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-6"
          {...(reducedMotion ? motionProps(true) : panelTransition)}
        >
        {panel.kind === 'grammar' && (
          <MarkdownWithTts
            content={panel.markdown}
            className="prose prose-sm max-w-none text-(--text-secondary)"
          />
        )}

        {panel.kind === 'activity' && (
          <div>
            {panel.activity.description && (
              <p className="text-sm text-(--text-secondary) mb-4">{panel.activity.description}</p>
            )}
            <ActivityRenderer
              activity={panel.activity}
              chapterId={panel.chapterId}
              moduleId={panel.moduleId}
              onHelp={onActivityDifficult}
              onExit={clearPanel}
              onPhaseChange={onActivityPhaseChange}
              onComplete={(result) => onActivityComplete?.({
                ...result,
                chapterId: panel.chapterId,
                moduleId: panel.moduleId,
              })}
            />
          </div>
        )}

        {panel.kind === 'question' && (
          <div className="space-y-4">
            <p className="text-(--text-primary) font-medium">{panel.prompt}</p>
            {panel.options && panel.options.length > 0 && (
              <ul className="space-y-2">
                {panel.options.map((opt, i) => {
                  const answered = selectedOption !== null
                  const isSelected = selectedOption === i
                  const isCorrect = panel.correctIndex !== undefined && i === panel.correctIndex
                  const showResult = answered && (isSelected || isCorrect)
                  return (
                    <li key={`${opt}-${i}`}>
                      <button
                        type="button"
                        disabled={answered}
                        onClick={() => handleQuestionSelect(i)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                          !answered && 'border-(--border-primary) bg-(--bg-card) text-(--text-secondary) hover:border-(--accent) hover:bg-(--accent-soft)',
                          showResult && isCorrect && 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300',
                          showResult && isSelected && !isCorrect && 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300',
                          answered && !showResult && 'border-(--border-primary) bg-(--bg-card) text-(--text-muted) opacity-60',
                        )}
                      >
                        <span className="font-bold text-(--accent)">{String.fromCharCode(65 + i)}.</span>
                        <span className="flex-1">{opt}</span>
                        {showResult && isCorrect && <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
                        {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
