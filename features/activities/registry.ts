import { z } from 'zod'
import { activityPropsSchemas, type ActivityTypeKey } from './contracts'
import {
  ACTIVITY_RUNTIME_CONTRACT_VERSION,
  createActivityCapabilities,
  createHintActivityCapabilities,
  type ActivityCapabilities,
} from './runtime-contract'
import type { AnyActivitySnapshotContract } from './snapshot'
import {
  dictationSnapshot,
  flashcardSnapshot,
  listeningSnapshot,
  pronunciationSnapshot,
  quizSnapshot,
  sentenceBuilderSnapshot,
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
  contractVersion: typeof ACTIVITY_RUNTIME_CONTRACT_VERSION
  schema: z.ZodTypeAny
  renderer: ActivityTypeKey
  evaluator: (result: ActivityResultInput) => ActivityEvaluation
  capabilities: ActivityCapabilities
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
  capabilities: ActivityCapabilities,
  snapshot: AnyActivitySnapshotContract,
): ActivityDefinition {
  return {
    contractVersion: ACTIVITY_RUNTIME_CONTRACT_VERSION,
    schema: activityPropsSchemas[type],
    renderer: type,
    evaluator: evaluateScore,
    capabilities,
    behavior: sharedActivityBehavior,
    snapshot: snapshot as AnyActivitySnapshotContract,
  }
}

export const activityRegistry = {
  quiz: definition('quiz', createActivityCapabilities('itemFeedback'), quizSnapshot),
  flashcard: definition('flashcard', createActivityCapabilities('audio', 'itemFeedback'), flashcardSnapshot),
  'word-match': definition('word-match', createActivityCapabilities(), wordMatchSnapshot),
  'sentence-builder': definition('sentence-builder', createActivityCapabilities(), sentenceBuilderSnapshot),
  'word-scramble': definition('word-scramble', createHintActivityCapabilities(3), wordScrambleSnapshot),
  listening: definition('listening', createActivityCapabilities('audio', 'itemFeedback'), listeningSnapshot),
  dictation: definition('dictation', createHintActivityCapabilities(3, 'audio'), dictationSnapshot),
  pronunciation: definition('pronunciation', createHintActivityCapabilities(3, 'microphone'), pronunciationSnapshot),
} satisfies Record<ActivityTypeKey, ActivityDefinition>

export function getActivityDefinition(type: string): ActivityDefinition | null {
  return type in activityRegistry ? activityRegistry[type as ActivityTypeKey] : null
}

export function getDeclaredCapabilities(type: ActivityTypeKey): ActivityCapabilities {
  return activityRegistry[type].capabilities
}
