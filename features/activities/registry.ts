import { z } from 'zod'
import { activityPropsSchemas, type ActivityTypeKey } from './contracts'
import type { AnyActivitySnapshotContract } from './snapshot'
import {
  dictationSnapshot,
  dragDropSnapshot,
  flashcardSnapshot,
  listeningSnapshot,
  pronunciationSnapshot,
  quizSnapshot,
  sentenceBuilderSnapshot,
  svgSceneSnapshot,
  wordMatchSnapshot,
  wordScrambleSnapshot,
} from './snapshots'

export interface ActivityEvaluation {
  scorePercent: number
}

export interface ActivityResultInput {
  score: number
  total: number
  scorePercent?: number
  explanations?: string[]
  weakItemIndexes?: number[]
  metrics?: Record<string, number>
}

export interface ActivityDefinition {
  schema: z.ZodTypeAny
  renderer: ActivityTypeKey
  evaluator: (result: ActivityResultInput) => ActivityEvaluation
  capabilities: readonly string[]
  behavior: ActivityBehavior
  snapshot: AnyActivitySnapshotContract
}

export interface ActivityBehavior {
  reset: true
  retry: true
  result: true
  persistence: true
  review: true
}

export const sharedActivityBehavior: ActivityBehavior = {
  reset: true,
  retry: true,
  result: true,
  persistence: true,
  review: true,
}

function evaluateScore(result: ActivityResultInput): ActivityEvaluation {
  return { scorePercent: typeof result.scorePercent === 'number' ? result.scorePercent : Math.round((result.score / result.total) * 100) }
}

function definition(
  type: ActivityTypeKey,
  capabilities: readonly string[],
  snapshot: AnyActivitySnapshotContract,
): ActivityDefinition {
  return {
    schema: activityPropsSchemas[type],
    renderer: type,
    evaluator: evaluateScore,
    capabilities,
    behavior: sharedActivityBehavior,
    snapshot: snapshot as AnyActivitySnapshotContract,
  }
}

export const activityRegistry = {
  quiz: definition('quiz', ['keyboard', 'review'], quizSnapshot),
  flashcard: definition('flashcard', ['keyboard', 'audio', 'review'], flashcardSnapshot),
  'word-match': definition('word-match', ['keyboard', 'review'], wordMatchSnapshot),
  'sentence-builder': definition('sentence-builder', ['keyboard', 'review'], sentenceBuilderSnapshot),
  'svg-scene': definition('svg-scene', ['keyboard', 'review'], svgSceneSnapshot),
  'word-scramble': definition('word-scramble', ['keyboard', 'review'], wordScrambleSnapshot),
  listening: definition('listening', ['keyboard', 'audio', 'review'], listeningSnapshot),
  dictation: definition('dictation', ['keyboard', 'audio', 'review'], dictationSnapshot),
  pronunciation: definition('pronunciation', ['keyboard', 'microphone', 'review'], pronunciationSnapshot),
  'drag-drop': definition('drag-drop', ['keyboard', 'review'], dragDropSnapshot),
} satisfies Record<ActivityTypeKey, ActivityDefinition>

export function getActivityDefinition(type: string): ActivityDefinition | null {
  return type in activityRegistry ? activityRegistry[type as ActivityTypeKey] : null
}
