'use client'

import type { ReactNode } from 'react'
import type { ChapterActivity } from '@/types'
import {
  Quiz,
  Flashcard,
  WordMatch,
  SentenceBuilder,
  SVGInteractive,
  WordScramble,
  Listening,
  Dictation,
  Pronunciation,
  DragDrop,
} from '@/components/games'
import { activityRegistry, type ActivityTypeKey } from '@/features/activities'
import { getReviewContentRefs } from '@/lib/srs/refs'
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
}

interface ActivityRendererProps {
  activity: ChapterActivity
  onComplete?: (result: ActivityCompleteResult) => void
}

type GameResult = Record<string, unknown> & { score: number; total: number; scorePercent?: number }
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

export default function ActivityRenderer({ activity, onComplete }: ActivityRendererProps) {
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
    const evaluation = definition.evaluator(result)
    onComplete?.({
      activityId: activity.id,
      activityType: activity.type,
      score: result.score,
      total: result.total,
      scorePercent: evaluation.scorePercent,
      details: result,
      reviewContentRefs: evaluation.scorePercent < 100 ? getReviewContentRefs(activity) : [],
    })
  }

  return renderers[definition.renderer](validated.data, handleComplete)
}
