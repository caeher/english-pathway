'use client'

import dynamic from 'next/dynamic'
import { Component, useState, type ReactNode } from 'react'
import type { ChapterActivity } from '@/types'
import { activityRegistry, type ActivityTypeKey } from '@/features/activities'
import { getReviewContentRefs } from '@/lib/srs/refs'
import { normalizeActivityResult } from '@/lib/games/result'
import { ActivityControlBar } from './ActivityControlBar'
import type {
  DictationItem,
  FlashcardData,
  ListeningItem,
  MatchPair,
  PronunciationItem,
  QuizQuestion,
  SentenceChallenge,
  SVGScene,
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
const SVGInteractive = dynamicActivity(() => import('@/components/games/SVGInteractive'))
const WordScramble = dynamicActivity(() => import('@/components/games/WordScramble'))
const Listening = dynamicActivity(() => import('@/components/games/Listening'))
const Dictation = dynamicActivity(() => import('@/components/games/Dictation'))
const Pronunciation = dynamicActivity(() => import('@/components/games/Pronunciation'))
const DragDrop = dynamicActivity(() => import('@/components/games/DragDrop'))

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
}

interface ActivityRendererProps {
  activity: ChapterActivity
  onComplete?: (result: ActivityCompleteResult) => void
  onHelp?: (activityId: string) => void
  onExit?: () => void
}

type GameResult = Record<string, unknown> & { score: number; total: number; scorePercent?: number; weakItemIndexes?: number[] }
type RenderActivity = (props: unknown, onComplete: (result: GameResult) => void) => ReactNode

const renderers: Record<ActivityTypeKey, RenderActivity> = {
  quiz: (props, onComplete) => <Quiz questions={(props as { questions: QuizQuestion[] }).questions} onComplete={(result) => onComplete({ ...result, scorePercent: result.scorePercent })} />,
  flashcard: (props, onComplete) => <Flashcard cards={(props as { cards: FlashcardData[] }).cards} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />,
  'word-match': (props, onComplete) => <WordMatch pairs={(props as { pairs: MatchPair[] }).pairs} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />,
  'sentence-builder': (props, onComplete) => <SentenceBuilder sentences={(props as { sentences: SentenceChallenge[] }).sentences} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />,
  'svg-scene': (props, onComplete) => <SVGInteractive scene={(props as { scene: SVGScene }).scene} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />,
  'word-scramble': (props, onComplete) => <WordScramble words={(props as { words: WordScrambleItem[] }).words} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />,
  listening: (props, onComplete) => <Listening items={(props as { items: ListeningItem[] }).items} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />,
  dictation: (props, onComplete) => <Dictation items={(props as { items: DictationItem[] }).items} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />,
  pronunciation: (props, onComplete) => <Pronunciation items={(props as { items: PronunciationItem[] }).items} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />,
  'drag-drop': (props, onComplete) => {
    const data = props as { mode: 'match' | 'sentence'; pairs?: MatchPair[]; sentences?: SentenceChallenge[] }
    return <DragDrop mode={data.mode} pairs={data.pairs} sentences={data.sentences} onComplete={(result) => onComplete({ ...result, scorePercent: result.score })} />
  },
}

export default function ActivityRenderer({ activity, onComplete, onHelp, onExit }: ActivityRendererProps) {
  const [attempt, setAttempt] = useState(0)
  const type = activity.type as ActivityTypeKey
  const definition = activityRegistry[type]
  if (!definition) {
    return <p className="text-sm text-(--text-muted)">Unsupported activity type: {activity.type}</p>
  }

  const validated = definition.schema.safeParse(activity.props)
  if (!validated.success) {
    console.error(`Invalid props for activity ${activity.id} (${activity.type})`, validated.error)
    return <p className="text-sm text-(--text-muted)">This activity could not be loaded. Invalid configuration.</p>
  }

  const handleComplete = (result: GameResult) => {
    const normalized = normalizeActivityResult(result)
    onComplete?.({
      activityId: activity.id,
      activityType: activity.type,
      score: result.score,
      total: result.total,
      scorePercent: normalized.scorePercent,
      details: result,
      correctness: normalized.correctness,
      nextAction: normalized.nextAction,
      metrics: normalized.metrics,
      reviewContentRefs: normalized.weakItemIndexes.length
        ? getReviewContentRefs(activity, normalized.weakItemIndexes)
        : normalized.scorePercent < 100 ? getReviewContentRefs(activity) : [],
    })
  }

  return (
    <div>
      <ActivityControlBar activityTitle={activity.title} activityType={activity.type} onHelp={onHelp ? () => onHelp(activity.id) : undefined} onReset={() => setAttempt((value) => value + 1)} onExit={onExit ?? (() => {})} />
      <ActivityLoadBoundary onRetry={() => setAttempt((value) => value + 1)}>
        <div key={attempt}>{renderers[definition.renderer](validated.data, handleComplete)}</div>
      </ActivityLoadBoundary>
    </div>
  )
}
