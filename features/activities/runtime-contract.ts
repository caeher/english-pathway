import { z } from 'zod'
import type { ActivityTypeKey } from './contracts'

export const ACTIVITY_RUNTIME_CONTRACT_VERSION = 1 as const

export const activityCapabilitySchema = z.enum([
  'hint',
  'progress',
  'snapshot',
  'itemFeedback',
  'difficulty',
  'keyboard',
  'audio',
  'microphone',
  'review',
])

export type ActivityCapability = z.infer<typeof activityCapabilitySchema>

export interface ActivityCapabilities {
  supports: ReadonlySet<ActivityCapability>
  hintLevels?: 1 | 2 | 3
}

export const activityCompleteSummarySchema = z.object({
  activityId: z.string().min(1),
  activityType: z.string().min(1),
  score: z.number(),
  total: z.number(),
  scorePercent: z.number().optional(),
  correctness: z.enum(['complete', 'partial', 'needs-practice']).optional(),
  weakItemIndexes: z.array(z.number().int().min(0)).optional(),
})

export type ActivityCompleteSummary = z.infer<typeof activityCompleteSummarySchema>

export const activityRuntimeEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('started'),
    activityId: z.string().min(1),
    activityType: z.string().min(1),
  }),
  z.object({
    type: z.literal('itemAnswered'),
    activityId: z.string().min(1),
    activityType: z.string().min(1),
    itemIndex: z.number().int().min(0),
    correct: z.boolean(),
  }),
  z.object({
    type: z.literal('hintRequested'),
    activityId: z.string().min(1),
    activityType: z.string().min(1),
    itemIndex: z.number().int().min(0).optional(),
    level: z.number().int().min(1),
  }),
  z.object({
    type: z.literal('completed'),
    activityId: z.string().min(1),
    activityType: z.string().min(1),
    result: activityCompleteSummarySchema,
  }),
  z.object({
    type: z.literal('abandoned'),
    activityId: z.string().min(1),
    activityType: z.string().min(1),
    reason: z.enum(['exit', 'skip']),
  }),
])

export type ActivityRuntimeEvent = z.infer<typeof activityRuntimeEventSchema>

const BASE_CAPABILITIES = ['progress', 'snapshot', 'keyboard', 'review'] as const satisfies readonly ActivityCapability[]

export function createActivityCapabilities(
  ...extra: ActivityCapability[]
): ActivityCapabilities {
  return { supports: new Set([...BASE_CAPABILITIES, ...extra]) }
}

export function createHintActivityCapabilities(
  hintLevels: 1 | 2 | 3,
  ...extra: ActivityCapability[]
): ActivityCapabilities {
  return { supports: new Set([...BASE_CAPABILITIES, 'hint', ...extra]), hintLevels }
}

export function hasCapability(
  capabilities: ActivityCapabilities,
  capability: ActivityCapability,
): boolean {
  return capabilities.supports.has(capability)
}

export function hasActivityCapability(
  definition: { capabilities: ActivityCapabilities },
  capability: ActivityCapability,
): boolean {
  return hasCapability(definition.capabilities, capability)
}

export function extractItemIndexFromProgress(
  activityType: ActivityTypeKey,
  payload: unknown,
): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined

  const progress = payload as Record<string, unknown>
  if (typeof progress.current === 'number' && progress.current >= 0) {
    return progress.current
  }
  if (typeof progress.index === 'number' && progress.index >= 0) {
    return progress.index
  }
  if (activityType === 'flashcard' && typeof progress.currentIndex === 'number') {
    return progress.currentIndex
  }
  if (typeof progress.decisionIndex === 'number' && progress.decisionIndex >= 0) {
    return progress.decisionIndex
  }
  return undefined
}

export function toActivityCompleteSummary(input: {
  activityId: string
  activityType: string
  score: number
  total: number
  scorePercent?: number
  correctness?: 'complete' | 'partial' | 'needs-practice'
  weakItemIndexes?: number[]
}): ActivityCompleteSummary {
  return {
    activityId: input.activityId,
    activityType: input.activityType,
    score: input.score,
    total: input.total,
    scorePercent: input.scorePercent,
    correctness: input.correctness,
    weakItemIndexes: input.weakItemIndexes,
  }
}
