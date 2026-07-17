'use client'

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
import type { ActivityTypeKey } from '@/lib/content/schemas'
import { validateActivityProps } from '@/lib/content/schemas'
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

function propsForType(type: ActivityTypeKey, props: Record<string, unknown>) {
  const result = validateActivityProps(type, props)
  if (!result.success) {
    console.error(`Invalid props for activity type ${type}`, result.error)
    return null
  }
  return result.data
}

export default function ActivityRenderer({ activity, onComplete }: ActivityRendererProps) {
  const validated = propsForType(activity.type as ActivityTypeKey, activity.props)
  if (!validated) {
    return (
      <p className="text-sm text-(--text-muted)">
        This activity could not be loaded. Invalid configuration.
      </p>
    )
  }

  const handleComplete = (result: Record<string, unknown> & { score: number; total: number }) => {
    const scorePercent =
      typeof result.scorePercent === 'number'
        ? result.scorePercent
        : Math.round((result.score / result.total) * 100)
    onComplete?.({
      activityId: activity.id,
      activityType: activity.type,
      score: result.score,
      total: result.total,
      scorePercent,
      details: result,
      reviewContentRefs: scorePercent < 100 ? getReviewContentRefs(activity) : [],
    })
  }

  switch (activity.type) {
    case 'quiz':
      return (
        <Quiz
          questions={(validated as { questions: QuizQuestion[] }).questions}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.scorePercent })}
        />
      )
    case 'flashcard':
      return (
        <Flashcard
          cards={(validated as { cards: FlashcardData[] }).cards}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    case 'word-match':
      return (
        <WordMatch
          pairs={(validated as { pairs: MatchPair[] }).pairs}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    case 'sentence-builder':
      return (
        <SentenceBuilder
          sentences={(validated as { sentences: SentenceChallenge[] }).sentences}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    case 'svg-scene':
      return (
        <SVGInteractive
          scene={(validated as unknown as { scene: SVGScene }).scene}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    case 'word-scramble':
      return (
        <WordScramble
          words={(validated as { words: WordScrambleItem[] }).words}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    case 'listening':
      return (
        <Listening
          items={(validated as { items: ListeningItem[] }).items}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    case 'dictation':
      return (
        <Dictation
          items={(validated as { items: DictationItem[] }).items}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    case 'pronunciation':
      return (
        <Pronunciation
          items={(validated as { items: PronunciationItem[] }).items}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    case 'drag-drop': {
      const data = validated as {
        mode: 'match' | 'sentence'
        pairs?: MatchPair[]
        sentences?: SentenceChallenge[]
      }
      return (
        <DragDrop
          mode={data.mode}
          pairs={data.pairs}
          sentences={data.sentences}
          onComplete={(r) => handleComplete({ ...r, scorePercent: r.score })}
        />
      )
    }
    default:
      return (
        <p className="text-sm text-(--text-muted)">
          Unsupported activity type: {activity.type}
        </p>
      )
  }
}
