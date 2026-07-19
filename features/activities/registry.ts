import { z } from 'zod'
import { activityPropsSchemas, type ActivityTypeKey } from './contracts'

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

function definition(type: ActivityTypeKey, capabilities: readonly string[]): ActivityDefinition {
  return { schema: activityPropsSchemas[type], renderer: type, evaluator: evaluateScore, capabilities, behavior: sharedActivityBehavior }
}

export const activityRegistry = {
  quiz: definition('quiz', ['keyboard', 'review']),
  flashcard: definition('flashcard', ['keyboard', 'audio', 'review']),
  'word-match': definition('word-match', ['keyboard', 'review']),
  'sentence-builder': definition('sentence-builder', ['keyboard', 'review']),
  'svg-scene': definition('svg-scene', ['keyboard', 'review']),
  'word-scramble': definition('word-scramble', ['keyboard', 'review']),
  listening: definition('listening', ['keyboard', 'audio', 'review']),
  dictation: definition('dictation', ['keyboard', 'audio', 'review']),
  pronunciation: definition('pronunciation', ['keyboard', 'microphone', 'review']),
  'drag-drop': definition('drag-drop', ['keyboard', 'review']),
} satisfies Record<ActivityTypeKey, ActivityDefinition>

export function getActivityDefinition(type: string): ActivityDefinition | null {
  return type in activityRegistry ? activityRegistry[type as ActivityTypeKey] : null
}
