'use client'

import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ChapterActivity } from '@/types'
import {
  activityRegistry,
  extractItemIndexFromProgress,
  hasActivityCapability,
  toActivityCompleteSummary,
  type ActivityRuntimeEvent,
  type ActivityTypeKey,
  type ResolvedHint,
  type TutorHintContext,
} from '@/features/activities'
import {
  MAX_GRADUATED_HINT_LEVEL,
  buildTutorHintRequest,
  resolveEditorialHint,
  type GraduatedHintLevel,
} from '@/features/activities/hints'
import { trackEvent } from '@/lib/analytics/events'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { normalizeActivityResult } from '@/lib/games/result'
import { isActivityCompleted } from '@/features/progress/client'
import { listChapterActivities, showActivity } from '@/lib/learn/client-tools'
import { resolveNextActivityId } from '@/lib/learn/next-activity'
import {
  planFollowUpPractice,
  validateFollowUpActivityId,
  type FollowUpDecision,
} from '@/lib/learn/follow-up-planner'
import type { ActivityUiPhase } from '@/lib/learn/session-ui-state'
import { learnSessionActions } from '@/stores/useLearnSessionStore'
import {
  loadSnapshot,
  purgeExpiredSnapshots,
  removeSnapshot,
  saveSnapshot,
  summarizeSnapshot,
} from '@/lib/storage/activity-snapshot'
import type { ActivityHintMeta } from '@/features/activities/snapshot'
import { ActivityControlBar } from './ActivityControlBar'
import { ActivityHintTray } from './ActivityHintTray'
import ActivityCompletionCard from './ActivityCompletionCard'
import ActivityResumePrompt from './ActivityResumePrompt'
import type {
  DictationItem,
  FlashcardData,
  ListeningItem,
  MatchPair,
  PronunciationItem,
  QuizQuestion,
  SentenceChallenge,
  WordScrambleItem,
} from '@/types'

function ActivityLoadingFallback() {
  return <div className="min-h-56 animate-pulse rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5" role="status" aria-live="polite">Loading this activity…</div>
}

interface ActivityLoadBoundaryProps { children: ReactNode; onRetry: () => void }
interface ActivityLoadBoundaryState { hasError: boolean }

class ActivityLoadBoundary extends Component<ActivityLoadBoundaryProps, ActivityLoadBoundaryState> {
  state: ActivityLoadBoundaryState = { hasError: false }

  static getDerivedStateFromError() { return { hasError: true } }

  render() {
    if (this.state.hasError) {
      return <div className="min-h-56 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300" role="alert">This activity could not be loaded. <button type="button" className="font-semibold underline" onClick={() => { this.setState({ hasError: false }); this.props.onRetry() }}>Try again</button></div>
    }
    return this.props.children
  }
}

const dynamicActivity = <T extends object>(loader: () => Promise<{ default: React.ComponentType<T> }>) => dynamic(loader, { ssr: false, loading: ActivityLoadingFallback })
const Quiz = dynamicActivity(() => import('@/components/games/Quiz'))
const Flashcard = dynamicActivity(() => import('@/components/games/Flashcard'))
const WordMatch = dynamicActivity(() => import('@/components/games/WordMatch'))
const SentenceBuilder = dynamicActivity(() => import('@/components/games/SentenceBuilder'))
const WordScramble = dynamicActivity(() => import('@/components/games/WordScramble'))
const Listening = dynamicActivity(() => import('@/components/games/Listening'))
const Dictation = dynamicActivity(() => import('@/components/games/Dictation'))
const Pronunciation = dynamicActivity(() => import('@/components/games/Pronunciation'))

export interface ActivityCompleteResult {
  activityId: string
  activityType: string
  score: number
  total: number
  scorePercent?: number
  details?: Record<string, unknown>
  reviewContentRefs?: string[]
  chapterId?: string
  moduleId?: string
  correctness?: 'complete' | 'partial' | 'needs-practice'
  nextAction?: 'continue' | 'retry' | 'review'
  metrics?: Record<string, number>
  explanations?: string[]
  weakItemIndexes?: number[]
  followUpDecision?: FollowUpDecision
}

interface ActivityRendererProps {
  activity: ChapterActivity
  chapterId?: string
  moduleId?: string
  onComplete?: (result: ActivityCompleteResult) => void
  onHelp?: (activityId: string, context?: TutorHintContext) => void
  onExit?: () => void
  onPhaseChange?: (phase: ActivityUiPhase) => void
  onRuntimeEvent?: (event: ActivityRuntimeEvent) => void
}

type GameResult = Record<string, unknown> & {
  score: number
  total: number
  scorePercent?: number
  weakItemIndexes?: number[]
  explanations?: string[]
}

type RenderActivity = (
  props: unknown,
  onComplete: (result: GameResult) => void,
  progressProps: { initialProgress?: unknown; onProgressChange?: (progress: unknown) => void },
) => ReactNode

const renderers: Record<ActivityTypeKey, RenderActivity> = {
  quiz: (props, onComplete, progressProps) => (
    <Quiz
      questions={(props as { questions: QuizQuestion[] }).questions}
      initialProgress={progressProps.initialProgress as never}
      onProgressChange={progressProps.onProgressChange as never}
      onComplete={(result) => onComplete({ ...result, scorePercent: result.scorePercent })}
    />
  ),
  flashcard: (props, onComplete, progressProps) => (
    <Flashcard
      cards={(props as { cards: FlashcardData[] }).cards}
      initialProgress={progressProps.initialProgress as never}
      onProgressChange={progressProps.onProgressChange as never}
      onComplete={(result) => onComplete({ ...result, scorePercent: result.score })}
    />
  ),
  'word-match': (props, onComplete, progressProps) => (
    <WordMatch
      pairs={(props as { pairs: MatchPair[] }).pairs}
      initialProgress={progressProps.initialProgress as never}
      onProgressChange={progressProps.onProgressChange as never}
      onComplete={(result) => onComplete({ ...result, scorePercent: result.score })}
    />
  ),
  'sentence-builder': (props, onComplete, progressProps) => (
    <SentenceBuilder
      sentences={(props as { sentences: SentenceChallenge[] }).sentences}
      initialProgress={progressProps.initialProgress as never}
      onProgressChange={progressProps.onProgressChange as never}
      onComplete={(result) => onComplete({ ...result, scorePercent: result.score })}
    />
  ),
  'word-scramble': (props, onComplete, progressProps) => (
    <WordScramble
      words={(props as { words: WordScrambleItem[] }).words}
      initialProgress={progressProps.initialProgress as never}
      onProgressChange={progressProps.onProgressChange as never}
      onComplete={(result) => onComplete({ ...result, scorePercent: result.score })}
    />
  ),
  listening: (props, onComplete, progressProps) => (
    <Listening
      items={(props as { items: ListeningItem[] }).items}
      initialProgress={progressProps.initialProgress as never}
      onProgressChange={progressProps.onProgressChange as never}
      onComplete={(result) => onComplete({ ...result, scorePercent: result.score })}
    />
  ),
  dictation: (props, onComplete, progressProps) => (
    <Dictation
      items={(props as { items: DictationItem[] }).items}
      initialProgress={progressProps.initialProgress as never}
      onProgressChange={progressProps.onProgressChange as never}
      onComplete={(result) => onComplete({ ...result, scorePercent: result.score })}
    />
  ),
  pronunciation: (props, onComplete, progressProps) => (
    <Pronunciation
      items={(props as { items: PronunciationItem[] }).items}
      initialProgress={progressProps.initialProgress as never}
      onProgressChange={progressProps.onProgressChange as never}
      onComplete={(result) => onComplete({ ...result, scorePercent: result.scorePercent })}
    />
  ),
}

type ResumeState = 'checking' | 'prompt' | 'playing'
type ActivityPhase = 'playing' | 'completed'

function extractExplanations(result: GameResult): string[] {
  if (Array.isArray(result.explanations)) {
    return result.explanations.filter((item): item is string => typeof item === 'string')
  }
  return []
}

const ACCESSIBILITY_CAPABILITIES = ['keyboard', 'audio', 'microphone'] as const

export default function ActivityRenderer({
  activity,
  chapterId,
  moduleId,
  onComplete,
  onHelp,
  onExit,
  onPhaseChange,
  onRuntimeEvent,
}: ActivityRendererProps) {
  const [attempt, setAttempt] = useState(0)
  const [hintCount, setHintCount] = useState(0)
  const [visibleHint, setVisibleHint] = useState<ResolvedHint | null>(null)
  const [hintMeta, setHintMeta] = useState<ActivityHintMeta | undefined>(undefined)
  const startedEmittedRef = useRef(false)
  const [lastProgressPayload, setLastProgressPayload] = useState<unknown>(undefined)
  const [phase, setPhase] = useState<ActivityPhase>('playing')
  const [completedResult, setCompletedResult] = useState<ActivityCompleteResult | null>(null)
  const [followUpDecision, setFollowUpDecision] = useState<FollowUpDecision | null>(null)
  const [continueLoading, setContinueLoading] = useState(false)
  const [resumeState, setResumeState] = useState<ResumeState>('checking')
  const [savedSummary, setSavedSummary] = useState<string | null>(null)
  const [restoredProgress, setRestoredProgress] = useState<unknown>(undefined)

  const type = activity.type as ActivityTypeKey
  const definition = activityRegistry[type]

  const emitRuntimeEvent = useCallback((event: ActivityRuntimeEvent) => {
    onRuntimeEvent?.(event)
  }, [onRuntimeEvent])

  const canRequestHelp = Boolean(definition && hasActivityCapability(definition, 'hint'))

  const maxHintLevel = (definition?.capabilities.hintLevels ?? MAX_GRADUATED_HINT_LEVEL) as GraduatedHintLevel

  const validatedProps = useMemo(() => {
    if (!definition) return null
    const parsed = definition.schema.safeParse(activity.props)
    return parsed.success ? parsed.data : null
  }, [activity.props, definition])

  const accessibilityCapabilities = useMemo(
    () => ACCESSIBILITY_CAPABILITIES.filter((capability) => definition?.capabilities.supports.has(capability)),
    [definition],
  )

  useEffect(() => {
    purgeExpiredSnapshots()
  }, [])

  useEffect(() => {
    if (resumeState === 'checking') {
      onPhaseChange?.('checking')
      return
    }
    if (resumeState === 'prompt') {
      onPhaseChange?.('resume-prompt')
      return
    }
    if (phase === 'completed') {
      onPhaseChange?.('completed')
      return
    }
    onPhaseChange?.('playing')
  }, [phase, resumeState, onPhaseChange])

  useEffect(() => {
    let cancelled = false

    async function checkSnapshot() {
      const snapshot = loadSnapshot(activity.id)
      if (!snapshot || snapshot.activityType !== type) {
        if (!cancelled) setResumeState('playing')
        return
      }

      const completed = await isActivityCompleted(activity.id)
      if (cancelled) return

      if (completed) {
        removeSnapshot(activity.id)
        setResumeState('playing')
        return
      }

      setSavedSummary(summarizeSnapshot(snapshot))
      setResumeState('prompt')
    }

    setPhase('playing')
    setCompletedResult(null)
    setFollowUpDecision(null)
    setHintCount(0)
    setVisibleHint(null)
    setHintMeta(undefined)
    setResumeState('checking')
    setSavedSummary(null)
    setRestoredProgress(undefined)
    startedEmittedRef.current = false
    setLastProgressPayload(undefined)
    void checkSnapshot()

    return () => {
      cancelled = true
    }
  }, [activity.id, type, attempt])

  const handleProgressChange = useCallback((payload: unknown) => {
    if (definition && hasActivityCapability(definition, 'itemFeedback')) {
      const previousProgress = lastProgressPayload && typeof lastProgressPayload === 'object'
        ? lastProgressPayload as Record<string, unknown>
        : null
      const progress = payload && typeof payload === 'object'
        ? payload as Record<string, unknown>
        : null
      const answered = progress?.answered === true
      const wasAnswered = previousProgress?.answered === true
      const currentIndex = extractItemIndexFromProgress(type, payload)

      if (answered && !wasAnswered && typeof currentIndex === 'number') {
        const weakItemIndexes = Array.isArray(progress?.weakItemIndexes)
          ? progress.weakItemIndexes.filter((value): value is number => typeof value === 'number')
          : []
        emitRuntimeEvent({
          type: 'itemAnswered',
          activityId: activity.id,
          activityType: type,
          itemIndex: currentIndex,
          correct: !weakItemIndexes.includes(currentIndex),
        })
      }
    }

    setLastProgressPayload(payload)
    saveSnapshot({
      version: 1,
      activityId: activity.id,
      activityType: type,
      payload,
      hintMeta,
    })
  }, [activity.id, definition, emitRuntimeEvent, hintMeta, lastProgressPayload, type])

  const clearSnapshot = useCallback(() => {
    removeSnapshot(activity.id)
  }, [activity.id])

  const restoreHintFromSnapshot = useCallback((snapshot: ReturnType<typeof loadSnapshot>) => {
    if (!snapshot?.hintMeta || !validatedProps) return
    setHintMeta(snapshot.hintMeta)
    setHintCount(snapshot.hintMeta.level)
    const itemIndex = snapshot.hintMeta.itemIndex ?? 0
    const hint = resolveEditorialHint(type, validatedProps, itemIndex, snapshot.hintMeta.level)
    if (hint) setVisibleHint(hint)
  }, [type, validatedProps])

  const handleResume = useCallback(() => {
    const snapshot = loadSnapshot(activity.id)
    if (snapshot) {
      setRestoredProgress(snapshot.payload)
      restoreHintFromSnapshot(snapshot)
    }
    setResumeState('playing')
  }, [activity.id, restoreHintFromSnapshot])

  const handleStartOver = useCallback(() => {
    clearSnapshot()
    setRestoredProgress(undefined)
    setVisibleHint(null)
    setHintMeta(undefined)
    setAttempt((value) => value + 1)
    setResumeState('playing')
    setPhase('playing')
    setCompletedResult(null)
  }, [clearSnapshot])

  const handleReset = useCallback(() => {
    clearSnapshot()
    setRestoredProgress(undefined)
    setVisibleHint(null)
    setHintMeta(undefined)
    setAttempt((value) => value + 1)
    setResumeState('playing')
    setPhase('playing')
    setCompletedResult(null)
  }, [clearSnapshot])

  const handleExit = useCallback(() => {
    emitRuntimeEvent({
      type: 'abandoned',
      activityId: activity.id,
      activityType: type,
      reason: 'exit',
    })
    clearSnapshot()
    onExit?.()
  }, [activity.id, clearSnapshot, emitRuntimeEvent, onExit, type])

  const handleRetry = useCallback(() => {
    clearSnapshot()
    setRestoredProgress(undefined)
    setAttempt((value) => value + 1)
    setHintCount(0)
    setVisibleHint(null)
    setHintMeta(undefined)
    setPhase('playing')
    setCompletedResult(null)
    setFollowUpDecision(null)
    setResumeState('playing')
  }, [clearSnapshot])

  const navigateToActivity = useCallback(async (activityId: string) => {
    await showActivity(activityId)
    setPhase('playing')
    setCompletedResult(null)
    setFollowUpDecision(null)
    setAttempt((value) => value + 1)
  }, [])

  const handleDeclineFollowUp = useCallback(async () => {
    if (!chapterId) return

    setContinueLoading(true)
    try {
      const nextActivityId = await resolveNextActivityId(
        chapterId,
        activity.id,
        listChapterActivities,
        isActivityCompleted,
      )

      if (nextActivityId) {
        await navigateToActivity(nextActivityId)
        return
      }

      learnSessionActions.acknowledgeCompletion()
    } finally {
      setContinueLoading(false)
    }
  }, [activity.id, chapterId, navigateToActivity])

  const handleAcceptFollowUp = useCallback(async () => {
    if (!followUpDecision) return

    if (followUpDecision.action === 'retry' && followUpDecision.activityId === activity.id) {
      handleRetry()
      return
    }

    if (!followUpDecision.activityId) {
      learnSessionActions.acknowledgeCompletion()
      return
    }

    if (!chapterId) return

    setContinueLoading(true)
    try {
      const chapter = await listChapterActivities(chapterId)
      if (!validateFollowUpActivityId(followUpDecision.activityId, chapter.activities)) {
        await handleDeclineFollowUp()
        return
      }
      await navigateToActivity(followUpDecision.activityId)
    } finally {
      setContinueLoading(false)
    }
  }, [activity.id, chapterId, followUpDecision, handleDeclineFollowUp, handleRetry, navigateToActivity])

  const emitHintRequested = useCallback((level: number, itemIndex: number | undefined, source: 'editorial' | 'tutor') => {
    trackEvent('hint_requested', {
      activity_id: activity.id,
      activity_type: type,
      level,
      source,
      item_index: itemIndex,
    })
    emitRuntimeEvent({
      type: 'hintRequested',
      activityId: activity.id,
      activityType: type,
      itemIndex,
      level,
    })
  }, [activity.id, emitRuntimeEvent, type])

  const invokeTutorFallback = useCallback((itemIndex: number, level: GraduatedHintLevel) => {
    const context: TutorHintContext = {
      activityId: activity.id,
      activityType: type,
      activityTitle: activity.title,
      itemIndex,
      level,
      maxLevel: maxHintLevel,
    }
    learnSessionActions.requestHelp()
    onHelp?.(activity.id, context)
    emitHintRequested(level, itemIndex, 'tutor')
  }, [activity.id, activity.title, emitHintRequested, maxHintLevel, onHelp, type])

  const applyResolvedHint = useCallback((level: number, itemIndex: number, hint: ResolvedHint) => {
    setHintCount(level)
    setVisibleHint(hint)
    const meta: ActivityHintMeta = { level, itemIndex }
    setHintMeta(meta)
    if (lastProgressPayload) {
      saveSnapshot({
        version: 1,
        activityId: activity.id,
        activityType: type,
        payload: lastProgressPayload,
        hintMeta: meta,
      })
    }
    emitHintRequested(level, itemIndex, hint.source)
  }, [activity.id, emitHintRequested, lastProgressPayload, type])

  const requestNextHint = useCallback(() => {
    if (!validatedProps) return

    const itemIndex = extractItemIndexFromProgress(type, lastProgressPayload) ?? 0
    const nextLevel = hintCount + 1

    if (nextLevel > maxHintLevel) {
      setHintCount(nextLevel)
      invokeTutorFallback(itemIndex, maxHintLevel)
      return
    }

    const resolved = resolveEditorialHint(type, validatedProps, itemIndex, nextLevel)
    if (!resolved) {
      setHintCount(nextLevel)
      invokeTutorFallback(itemIndex, nextLevel as GraduatedHintLevel)
      return
    }

    if (resolved.revealsAnswer) {
      const confirmed = window.confirm(
        'Showing the full answer reduces the practice benefit of this item. Continue anyway?',
      )
      if (!confirmed) return
    }

    applyResolvedHint(nextLevel, itemIndex, resolved)
  }, [
    applyResolvedHint,
    hintCount,
    invokeTutorFallback,
    lastProgressPayload,
    maxHintLevel,
    type,
    validatedProps,
  ])

  const handleHelpDuringPlay = requestNextHint
  const handleRequestHelp = requestNextHint

  useEffect(() => {
    if (resumeState !== 'playing' || phase !== 'playing' || startedEmittedRef.current) return
    startedEmittedRef.current = true
    emitRuntimeEvent({
      type: 'started',
      activityId: activity.id,
      activityType: type,
    })
  }, [activity.id, emitRuntimeEvent, phase, resumeState, type])

  const progressProps = useMemo(() => ({
    initialProgress: restoredProgress,
    onProgressChange: resumeState === 'playing' && phase === 'playing' ? handleProgressChange : undefined,
  }), [restoredProgress, resumeState, phase, handleProgressChange])

  if (!definition) {
    return <p className="text-sm text-(--text-muted)">Unsupported activity type: {activity.type}</p>
  }

  const validated = definition.schema.safeParse(activity.props)
  if (!validated.success) {
    console.error(`Invalid props for activity ${activity.id} (${activity.type})`, validated.error)
    return <p className="text-sm text-(--text-muted)">This activity could not be loaded. Invalid configuration.</p>
  }

  const handleComplete = async (result: GameResult) => {
    clearSnapshot()
    const normalized = normalizeActivityResult(result)
    const explanations = extractExplanations(result)
    let decision: FollowUpDecision | null = null

    if (chapterId) {
      try {
        const chapter = await listChapterActivities(chapterId)
        const completionEntries = await Promise.all(
          chapter.activities.map(async (item) => [item.id, await isActivityCompleted(item.id)] as const),
        )
        const completedActivityIds = new Set(
          completionEntries.filter(([, done]) => done).map(([id]) => id),
        )
        decision = planFollowUpPractice({
          currentActivityId: activity.id,
          currentActivityType: activity.type,
          correctness: normalized.correctness,
          scorePercent: normalized.scorePercent,
          weakItemIndexes: normalized.weakItemIndexes,
          attempt,
          hintCount,
          chapterActivities: chapter.activities,
          completedActivityIds,
        })
        setFollowUpDecision(decision)
      } catch {
        setFollowUpDecision(null)
      }
    }

    const enriched: ActivityCompleteResult = {
      activityId: activity.id,
      activityType: activity.type,
      score: result.score,
      total: result.total,
      scorePercent: normalized.scorePercent,
      details: result,
      correctness: normalized.correctness,
      nextAction: normalized.nextAction,
      metrics: normalized.metrics,
      explanations,
      weakItemIndexes: normalized.weakItemIndexes,
      followUpDecision: decision ?? undefined,
      chapterId,
      moduleId,
      reviewContentRefs: normalized.weakItemIndexes.length
        ? getReviewContentRefs(activity, normalized.weakItemIndexes)
        : normalized.scorePercent < 100 ? getReviewContentRefs(activity) : [],
    }

    emitRuntimeEvent({
      type: 'completed',
      activityId: activity.id,
      activityType: type,
      result: toActivityCompleteSummary(enriched),
    })

    setCompletedResult(enriched)
    setPhase('completed')
    learnSessionActions.acknowledgeCompletion()
    onComplete?.(enriched)
  }

  return (
    <div>
      {phase === 'playing' && (
        <ActivityControlBar
          activityTitle={activity.title}
          activityType={activity.type}
          accessibilityCapabilities={accessibilityCapabilities}
          onHelp={canRequestHelp ? handleHelpDuringPlay : undefined}
          onReset={handleReset}
          onExit={handleExit}
        />
      )}
      {phase === 'playing' && visibleHint && (
        <ActivityHintTray
          hint={visibleHint}
          maxLevel={maxHintLevel}
          onMoreHelp={canRequestHelp ? requestNextHint : undefined}
        />
      )}
      {resumeState === 'checking' && phase === 'playing' && (
        <div className="min-h-24 animate-pulse rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5" role="status" aria-live="polite">
          Checking for saved progress…
        </div>
      )}
      {resumeState === 'prompt' && savedSummary && phase === 'playing' && (
        <ActivityResumePrompt summary={savedSummary} onResume={handleResume} onStartOver={handleStartOver} />
      )}
      {phase === 'completed' && completedResult && (
        <ActivityCompletionCard
          result={completedResult}
          followUp={followUpDecision}
          explanations={completedResult.explanations}
          onAcceptFollowUp={chapterId || followUpDecision ? handleAcceptFollowUp : undefined}
          onDeclineFollowUp={chapterId ? handleDeclineFollowUp : undefined}
          onRetry={handleRetry}
          onRequestHelp={canRequestHelp ? handleRequestHelp : undefined}
          continueLoading={continueLoading}
        />
      )}
      {phase === 'playing' && resumeState === 'playing' && (
        <ActivityLoadBoundary onRetry={() => setAttempt((value) => value + 1)}>
          <div key={attempt}>
            {renderers[definition.renderer](validated.data, handleComplete, progressProps)}
          </div>
        </ActivityLoadBoundary>
      )}
    </div>
  )
}
