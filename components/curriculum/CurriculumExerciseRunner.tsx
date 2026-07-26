'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, Lock, RotateCcw } from 'lucide-react'
import ActivityRenderer, { type ActivityCompleteResult } from '@/components/learn/ActivityRenderer'
import { Button } from '@/components/ui/button'
import { LEARN_PATH } from '@/features/learn/contracts'
import { curriculumChapterHref, curriculumModuleHref } from '@/lib/curriculum/href'
import type { ActivityExerciseState, ChapterProgressSummary } from '@/lib/curriculum/progress'
import { recordActivityCompletionEffects } from '@/lib/learning/activity-completion-effects'
import { useReducedMotion } from '@/lib/games/useReducedMotion'
import type { Chapter, ChapterActivity } from '@/types'

const CURRICULUM_AUTO_ADVANCE_MS = 800

interface CurriculumExerciseRunnerProps {
  chapter: Chapter
  moduleId: string
  initialProgress: ChapterProgressSummary
  nextChapter?: { moduleId: string; chapterId: string; title: string } | null
}

function findActivity(chapter: Chapter, activityId: string | null): ChapterActivity | null {
  if (!activityId) return null
  return chapter.activities.find((activity) => activity.id === activityId) ?? null
}

function sequenceLabel(state: ActivityExerciseState['sequenceState']) {
  switch (state) {
    case 'passed': return 'Passed'
    case 'current': return 'Current'
    case 'needs_retry': return 'Retry'
    default: return 'Locked'
  }
}

export default function CurriculumExerciseRunner({
  chapter,
  moduleId,
  initialProgress,
  nextChapter,
}: CurriculumExerciseRunnerProps) {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const [isPending, startTransition] = useTransition()
  const [progress, setProgress] = useState(initialProgress)
  const [activeActivityId, setActiveActivityId] = useState(
    initialProgress.nextUnlockedActivityId ?? initialProgress.nextActivityId ?? chapter.activities[0]?.id ?? null,
  )
  const [lastApproval, setLastApproval] = useState<{ passed: boolean; activityId: string } | null>(null)
  const instructionRef = useRef<HTMLHeadingElement>(null)
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeActivity = useMemo(
    () => findActivity(chapter, activeActivityId),
    [chapter, activeActivityId],
  )

  useEffect(() => {
    instructionRef.current?.focus({ preventScroll: true })
  }, [activeActivityId])

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
    }
  }, [])

  const findNextRequiredActivityId = useCallback((states: ActivityExerciseState[]) => {
    return chapter.activities.find(
      (activity) => activity.required && !states.find((state) => state.activityId === activity.id)?.passed,
    )?.id ?? null
  }, [chapter.activities])

  const refreshProgress = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const handleActivityComplete = useCallback(async (result: ActivityCompleteResult) => {
    if (!activeActivity) return
    const approval = await recordActivityCompletionEffects(result, {
      source: 'curriculum',
      activity: activeActivity,
    })
    setLastApproval({ passed: approval.passed, activityId: result.activityId })

    const nextStates = progress.activityStates.map((state) => {
      if (state.activityId !== result.activityId) return state
      return {
        ...state,
        passed: approval.passed || state.passed,
        attempts: state.attempts + 1,
        sequenceState: approval.passed ? 'passed' as const : 'needs_retry' as const,
      }
    })

    const passedRequired = nextStates.filter((state) => state.required && state.passed).length
    const totalRequired = nextStates.filter((state) => state.required).length
    const chapterCompleted = passedRequired === totalRequired && totalRequired > 0
    const nextUnlockedId = findNextRequiredActivityId(nextStates)

    setProgress((current) => ({
      ...current,
      passedRequiredActivities: passedRequired,
      completedActivities: passedRequired,
      completionPercent: totalRequired === 0 ? 0 : Math.round((passedRequired / totalRequired) * 100),
      status: chapterCompleted ? 'completed' : 'in_progress',
      activityStates: nextStates,
      nextActivityId: nextUnlockedId,
      nextUnlockedActivityId: nextUnlockedId,
    }))

    if (approval.passed && nextUnlockedId && nextUnlockedId !== result.activityId && !reducedMotion) {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = setTimeout(() => {
        setActiveActivityId(nextUnlockedId)
        setLastApproval(null)
        autoAdvanceTimerRef.current = null
      }, CURRICULUM_AUTO_ADVANCE_MS)
    }

    refreshProgress()
  }, [activeActivity, chapter.activities, findNextRequiredActivityId, progress.activityStates, reducedMotion, refreshProgress])

  const handleContinue = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = null
    }
    const nextId = progress.nextUnlockedActivityId ?? progress.nextActivityId
    if (nextId) setActiveActivityId(nextId)
    setLastApproval(null)
  }, [progress.nextActivityId, progress.nextUnlockedActivityId])

  const chapterCompleted = progress.status === 'completed'

  return (
    <section id="practice" aria-labelledby="practice-heading" className="mt-8 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="practice-heading" ref={instructionRef} tabIndex={-1} className="font-display text-2xl font-black text-(--text-primary)">
            Practice to complete this chapter
          </h2>
          <p className="mt-2 text-sm text-(--text-secondary)" aria-live="polite">
            {progress.passedRequiredActivities} of {progress.totalRequiredActivities} required exercises passed
            {progress.nextActivityId ? ` · Next required: ${findActivity(chapter, progress.nextActivityId)?.title ?? 'exercise'}` : ''}
          </p>
        </div>
        {chapterCompleted && (
          <span className="inline-flex items-center gap-2 rounded-xl bg-(--success-soft) px-3 py-2 text-sm font-bold text-(--success)">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Chapter completed
          </span>
        )}
      </div>

      <ol className="mt-6 space-y-2" aria-label="Exercise sequence">
        {progress.activityStates.filter((state) => state.required).map((state) => {
          const activity = findActivity(chapter, state.activityId)
          if (!activity) return null
          const isActive = state.activityId === activeActivityId
          const canSelect = state.sequenceState === 'passed' || state.sequenceState === 'current' || state.sequenceState === 'needs_retry'
          return (
            <li key={state.activityId}>
              <button
                type="button"
                disabled={!canSelect}
                onClick={() => canSelect && setActiveActivityId(state.activityId)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${isActive ? 'border-(--accent) bg-(--accent-soft)' : 'border-(--border-primary) bg-(--bg-secondary)'} ${canSelect ? 'hover:border-(--accent)' : 'opacity-60'}`}
              >
                <span className="font-bold text-(--text-primary)">{activity.title}</span>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-(--text-muted)">
                  {state.sequenceState === 'locked' && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                  {state.sequenceState === 'passed' && <CheckCircle2 className="h-3.5 w-3.5 text-(--success)" aria-hidden="true" />}
                  {state.sequenceState === 'needs_retry' && <RotateCcw className="h-3.5 w-3.5 text-(--accent)" aria-hidden="true" />}
                  {sequenceLabel(state.sequenceState)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {activeActivity && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-black text-(--text-primary)">{activeActivity.title}</h3>
          {activeActivity.description && <p className="mt-1 text-sm text-(--text-secondary)">{activeActivity.description}</p>}
          <div className="mt-4">
            <ActivityRenderer
              key={activeActivity.id}
              activity={activeActivity}
              chapterId={chapter.id}
              moduleId={moduleId}
              variant="curriculum"
              passThreshold={activeActivity.policy.mode === 'score' ? activeActivity.policy.passThreshold : undefined}
              approvalMode={activeActivity.policy.mode}
              onCurriculumContinue={handleContinue}
              onComplete={handleActivityComplete}
            />
          </div>
          {lastApproval && lastApproval.activityId === activeActivity.id && !lastApproval.passed && (
            <p className="mt-3 text-sm font-bold text-(--accent)" role="status">
              Score below the required threshold. Review the feedback and try again.
            </p>
          )}
        </div>
      )}

      {chapterCompleted && (
        <div className="mt-8 rounded-2xl border border-(--success)/30 bg-(--success-soft) p-5" role="status">
          <p className="font-display text-lg font-black text-(--text-primary)">You completed this chapter!</p>
          <p className="mt-1 text-sm text-(--text-secondary)">All required exercises are approved. Choose where to go next.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {nextChapter && (
              <Link href={curriculumChapterHref(nextChapter.moduleId, nextChapter.chapterId)} className="inline-flex items-center gap-2 rounded-xl bg-(--accent) px-4 py-2 text-sm font-bold text-white no-underline hover:bg-(--accent-hover)">
                Next chapter <ChevronRight className="h-4 w-4" />
              </Link>
            )}
            <Link href={curriculumModuleHref(moduleId)} className="inline-flex items-center gap-2 rounded-xl border border-(--border-primary) bg-(--bg-card) px-4 py-2 text-sm font-bold text-(--text-primary) no-underline hover:bg-(--bg-secondary)">
              Back to module
            </Link>
            <Link href={LEARN_PATH} className="inline-flex items-center gap-2 rounded-xl border border-(--border-primary) bg-(--bg-card) px-4 py-2 text-sm font-bold text-(--text-primary) no-underline hover:bg-(--bg-secondary)">
              Start a free tutor session
            </Link>
          </div>
        </div>
      )}

      {isPending && <p className="mt-3 text-xs text-(--text-muted)" aria-live="polite">Updating progress…</p>}
    </section>
  )
}
