'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, MessageCircle, XCircle } from 'lucide-react'
import type { BranchingDialogueProps } from '@/types'
import type { BranchingDialogueProgress } from '@/features/activities/snapshots/branching-dialogue'
import {
  computeBranchingDialogueScores,
  countDecisionNodes,
  findNode,
  isDecisionNode,
  isWeakChoice,
} from '@/features/activities/branching-dialogue'
import { ActivityAudioPlayer } from '@/components/ui/ActivityAudioPlayer'
import { formatAudioMetadata } from '@/lib/audio/curated-audio'
import { cn } from '@/lib/helpers'
import { useDebouncedProgress } from '@/lib/games/useDebouncedProgress'

interface BranchingDialogueComponentProps extends BranchingDialogueProps {
  initialProgress?: BranchingDialogueProgress
  onProgressChange?: (progress: BranchingDialogueProgress) => void
  onComplete?: (result: {
    score: number
    total: number
    scorePercent: number
    weakItemIndexes?: number[]
    explanations?: string[]
    metrics?: Record<string, number>
  }) => void
}

function buildInitialProgress(
  props: BranchingDialogueProps,
  initialProgress?: BranchingDialogueProgress,
): BranchingDialogueProgress {
  if (initialProgress) return initialProgress
  return {
    currentNodeId: props.startNodeId,
    decisionIndex: 0,
    choicesMade: [],
    weakItemIndexes: [],
    selectedChoiceIndex: null,
    answered: false,
    awaitingContinue: false,
  }
}

export default function BranchingDialogue({
  setting,
  characters = [],
  startNodeId,
  nodes,
  initialProgress,
  onProgressChange,
  onComplete,
}: BranchingDialogueComponentProps) {
  const props = useMemo(() => ({ setting, characters, startNodeId, nodes }), [setting, characters, startNodeId, nodes])
  const totalDecisions = useMemo(() => countDecisionNodes(nodes), [nodes])
  const characterMap = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters])

  const [progress, setProgress] = useState(() => buildInitialProgress(props, initialProgress))
  const [finished, setFinished] = useState(false)

  const currentNode = findNode(props, progress.currentNodeId)
  const selectedChoice = progress.selectedChoiceIndex != null && currentNode
    ? currentNode.choices[progress.selectedChoiceIndex]
    : null
  const isTerminalView = Boolean(currentNode && (currentNode.isTerminal || currentNode.choices.length === 0))

  const updateProgress = useCallback((next: BranchingDialogueProgress) => {
    setProgress(next)
  }, [])

  useDebouncedProgress(progress, onProgressChange, finished)

  const completeActivity = useCallback((choicesMade: BranchingDialogueProgress['choicesMade'], weakItemIndexes: number[], explanations: string[]) => {
    const { pragmaticScore, grammaticalScore, scorePercent } = computeBranchingDialogueScores(choicesMade)
    setFinished(true)
    onComplete?.({
      score: scorePercent,
      total: 100,
      scorePercent,
      weakItemIndexes,
      explanations,
      metrics: { pragmaticScore, grammaticalScore },
    })
  }, [onComplete])

  const handleSelect = useCallback((choiceIndex: number) => {
    if (!currentNode || progress.answered || isTerminalView) return

    const choice = currentNode.choices[choiceIndex]
    if (!choice) return

    const choiceRecord = {
      nodeId: currentNode.id,
      choiceId: choice.id,
      pragmaticRating: choice.pragmaticRating,
      grammaticalRating: choice.grammaticalRating ?? 'correct' as const,
    }
    const decisionIndex = progress.decisionIndex
    const weak = isWeakChoice(choice)
    const weakItemIndexes = weak
      ? [...progress.weakItemIndexes, decisionIndex]
      : progress.weakItemIndexes

    updateProgress({
      ...progress,
      selectedChoiceIndex: choiceIndex,
      answered: true,
      awaitingContinue: true,
      choicesMade: [...progress.choicesMade, choiceRecord],
      weakItemIndexes,
    })
  }, [currentNode, isTerminalView, progress, updateProgress])

  const handleContinue = useCallback(() => {
    if (!currentNode) return

    if (isTerminalView) {
      completeActivity(progress.choicesMade, progress.weakItemIndexes, progress.choicesMade.map((choice) => {
        const node = findNode(props, choice.nodeId)
        const selected = node?.choices.find((item) => item.id === choice.choiceId)
        return selected?.explanation ?? ''
      }).filter(Boolean))
      return
    }

    if (!selectedChoice) return

    const nextNode = findNode(props, selectedChoice.nextNodeId)
    if (!nextNode) return

    const nextIsTerminal = nextNode.isTerminal || nextNode.choices.length === 0
    const explanations = selectedChoice.explanation ? [selectedChoice.explanation] : []

    if (nextIsTerminal) {
      updateProgress({
        currentNodeId: nextNode.id,
        decisionIndex: progress.decisionIndex,
        choicesMade: progress.choicesMade,
        weakItemIndexes: progress.weakItemIndexes,
        selectedChoiceIndex: null,
        answered: false,
        awaitingContinue: false,
      })
      return
    }

    updateProgress({
      currentNodeId: nextNode.id,
      decisionIndex: progress.decisionIndex + 1,
      choicesMade: progress.choicesMade,
      weakItemIndexes: progress.weakItemIndexes,
      selectedChoiceIndex: null,
      answered: false,
      awaitingContinue: false,
    })

    if (explanations.length > 0) {
      // explanations are surfaced in the feedback panel before continue
    }
  }, [completeActivity, currentNode, isTerminalView, progress, props, selectedChoice, updateProgress])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (finished || !currentNode) return

      if (progress.awaitingContinue && event.key === 'Enter') {
        event.preventDefault()
        handleContinue()
        return
      }

      if (progress.answered || isTerminalView) return

      const choiceIndex = Number(event.key) - 1
      if (choiceIndex >= 0 && choiceIndex < currentNode.choices.length) {
        event.preventDefault()
        handleSelect(choiceIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentNode, finished, handleContinue, handleSelect, isTerminalView, progress.answered, progress.awaitingContinue])

  if (finished || !currentNode) return null

  const speaker = currentNode.speakerId ? characterMap.get(currentNode.speakerId) : undefined
  const transcript = currentNode.audio?.transcript ?? currentNode.prompt
  const metadata = formatAudioMetadata(currentNode.audio?.speaker ?? speaker?.name, currentNode.audio?.accent)
  const progressLabel = isTerminalView
    ? 'Closing'
    : `Decision ${Math.min(progress.decisionIndex + 1, totalDecisions)} / ${totalDecisions}`

  return (
    <div className="mx-auto max-w-2xl" role="region" aria-label="Branching dialogue activity" aria-describedby="branching-dialogue-description">
      <p id="branching-dialogue-description" className="sr-only">
        Read the situation, choose the most appropriate response, and review the communicative consequence before continuing.
      </p>

      <div className="mb-4 rounded-2xl border border-(--border-primary) bg-(--bg-tertiary) p-4">
        <p className="text-xs font-display font-bold uppercase tracking-wide text-(--text-muted)">Situation</p>
        <p className="mt-1 text-sm text-(--text-primary)">{setting}</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-display font-bold text-(--text-muted)">{progressLabel}</span>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-(--bg-tertiary)">
          <div
            className="h-full rounded-full bg-(--accent) transition-all"
            style={{ width: `${Math.min(100, ((progress.decisionIndex) / Math.max(totalDecisions, 1)) * 100)}%` }}
            aria-hidden
          />
        </div>
      </div>

      {!isTerminalView && (
        <p className="mb-3 text-sm text-(--text-secondary)">
          <span className="font-display font-bold text-(--accent)">Your goal:</span>
          {' '}
          {currentNode.intention}
        </p>
      )}

      <div className="mb-5 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-4">
        {speaker && (
          <p className="mb-2 text-xs font-display font-bold uppercase tracking-wide text-(--text-muted)">
            {speaker.name}
            {speaker.role ? ` · ${speaker.role}` : ''}
          </p>
        )}
        {currentNode.audio && (
          <div className="mb-3">
            <ActivityAudioPlayer fallbackText={currentNode.prompt} curated={currentNode.audio} />
          </div>
        )}
        <p className="text-base font-medium text-(--text-primary)">{currentNode.prompt}</p>
        {metadata && <p className="mt-2 text-xs text-(--text-muted)">{metadata}</p>}
      </div>

      {isTerminalView ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-(--success)/40 bg-(--success-soft) p-4" aria-live="polite">
            <p className="text-sm font-display font-bold text-(--text-primary)">Conversation complete</p>
            <p className="mt-1 text-sm text-(--text-secondary)">{currentNode.prompt}</p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center gap-2 rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-display font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
            >
              View results <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3" role="radiogroup" aria-label="Response options. Press 1-4 to choose quickly.">
            {currentNode.choices.map((choice, index) => {
              const isSelected = progress.selectedChoiceIndex === index
              const isOptimal = choice.pragmaticRating === 'optimal'
              const isAcceptable = choice.pragmaticRating === 'acceptable'
              let cls = 'border-(--border-primary) bg-(--bg-card) hover:border-(--accent)/50'

              if (progress.answered) {
                if (isOptimal) cls = 'border-(--success)/50 bg-(--success-soft)'
                else if (isAcceptable && isSelected) cls = 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                else if (isSelected) cls = 'border-red-400 bg-red-50 dark:bg-red-950/30'
                else cls = 'border-(--border-primary) opacity-50'
              }

              return (
                <motion.button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelect(index)}
                  disabled={progress.answered}
                  role="radio"
                  aria-checked={isSelected}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-default',
                    cls,
                  )}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--bg-tertiary) text-xs font-bold text-(--text-muted)">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-(--text-primary)">{choice.text}</span>
                  {progress.answered && isOptimal && <CheckCircle className="ml-auto h-5 w-5 shrink-0" style={{ color: 'var(--success)' }} />}
                  {progress.answered && isSelected && !isOptimal && <XCircle className="ml-auto h-5 w-5 shrink-0 text-red-500" />}
                </motion.button>
              )
            })}
          </div>

          {progress.answered && selectedChoice && (
            <div className="mt-5 space-y-3 rounded-xl border border-(--border-primary) bg-(--bg-card) p-4" aria-live="polite">
              <div className="flex items-center gap-2 text-sm font-display font-bold text-(--text-primary)">
                <MessageCircle className="h-4 w-4 text-(--accent)" />
                Feedback
              </div>
              {selectedChoice.consequence && (
                <p className="text-sm text-(--text-secondary)">
                  <span className="font-semibold text-(--text-primary)">What happens next:</span>
                  {' '}
                  {selectedChoice.consequence}
                </p>
              )}
              <p className="text-sm text-(--text-secondary)">{selectedChoice.explanation}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={cn(
                  'rounded-full px-2.5 py-1 font-semibold',
                  selectedChoice.pragmaticRating === 'optimal' ? 'bg-(--success-soft) text-(--success)' : selectedChoice.pragmaticRating === 'acceptable' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200',
                )}
                >
                  Pragmatic:
                  {' '}
                  {selectedChoice.pragmaticRating}
                </span>
                <span className={cn(
                  'rounded-full px-2.5 py-1 font-semibold',
                  (selectedChoice.grammaticalRating ?? 'correct') === 'correct'
                    ? 'bg-(--success-soft) text-(--success)'
                    : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200',
                )}
                >
                  Grammar:
                  {' '}
                  {selectedChoice.grammaticalRating ?? 'correct'}
                </span>
              </div>
              {transcript && (
                <p className="text-xs text-(--text-muted)">
                  Line heard:
                  {' '}
                  &quot;
                  {transcript}
                  &quot;
                </p>
              )}
            </div>
          )}

          {progress.awaitingContinue && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-2 rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-display font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
