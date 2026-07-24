import { z } from 'zod'
import type { LearningContinuation } from '@/lib/learning/continuation'

export const sessionPlanGoalSchema = z.enum(['continue', 'review', 'practice', 'conversation'])
export const sessionPlanSkillSchema = z.enum([
  'grammar',
  'vocabulary',
  'listening',
  'speaking',
  'reading',
  'pronunciation',
  'mixed',
])
export const sessionPlanDurationSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(20),
])
export const sessionPlanModeSchema = z.enum(['voice', 'text'])

export const sessionPlanSuggestedStepSchema = z.object({
  kind: z.enum(['activity', 'chapter', 'review']),
  id: z.string().min(1).optional(),
  label: z.string().min(1).max(120),
})

export const sessionPlanSchema = z.object({
  goal: sessionPlanGoalSchema,
  skill: sessionPlanSkillSchema,
  durationMinutes: sessionPlanDurationSchema,
  mode: sessionPlanModeSchema,
  suggestedStep: sessionPlanSuggestedStepSchema.optional(),
})

export type SessionPlanGoal = z.infer<typeof sessionPlanGoalSchema>
export type SessionPlanSkill = z.infer<typeof sessionPlanSkillSchema>
export type SessionPlanDuration = z.infer<typeof sessionPlanDurationSchema>
export type SessionPlanMode = z.infer<typeof sessionPlanModeSchema>
export type SessionPlanSuggestedStep = z.infer<typeof sessionPlanSuggestedStepSchema>
export type SessionPlan = z.infer<typeof sessionPlanSchema>

export const SESSION_PLAN_STORAGE_KEY = 'ep-session-plan'

export const SESSION_PLAN_GOAL_LABELS: Record<SessionPlanGoal, string> = {
  continue: 'Continue learning',
  review: 'Review weak areas',
  practice: 'Practice a skill',
  conversation: 'Quick conversation',
}

export const SESSION_PLAN_SKILL_LABELS: Record<SessionPlanSkill, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  listening: 'Listening',
  speaking: 'Speaking',
  reading: 'Reading',
  pronunciation: 'Pronunciation',
  mixed: 'Mixed skills',
}

export interface SessionPlanSuggestionContext {
  continuation?: LearningContinuation | null
  dailyGoalMinutes?: number | null
  preferredMode?: string | null
  mode?: SessionPlanMode
}

export interface SessionPlanSuggestions {
  defaults: SessionPlan
  continuationHint?: {
    title: string
    description: string
    label: string
  }
}

function normalizeDuration(minutes: number | null | undefined): SessionPlanDuration {
  if (minutes === 5 || minutes === 10 || minutes === 15 || minutes === 20) return minutes
  return 10
}

function normalizeMode(preferredMode: string | null | undefined, fallback: SessionPlanMode = 'text'): SessionPlanMode {
  if (preferredMode === 'voice' || preferredMode === 'text') return preferredMode
  return fallback
}

function suggestedStepFromContinuation(continuation: LearningContinuation): SessionPlanSuggestedStep | undefined {
  if (continuation.kind === 'review') {
    return { kind: 'review', label: continuation.title }
  }
  if (continuation.kind === 'resume') {
    const activityId = continuation.target.activityId ?? undefined
    return {
      kind: activityId ? 'activity' : 'chapter',
      id: activityId ?? continuation.target.chapterId,
      label: continuation.title,
    }
  }
  return undefined
}

function defaultGoalFromContinuation(continuation: LearningContinuation | null | undefined): SessionPlanGoal {
  if (!continuation) return 'practice'
  if (continuation.kind === 'review') return 'review'
  if (continuation.kind === 'resume') return 'continue'
  if (continuation.kind === 'completed') return 'review'
  return 'practice'
}

export function buildSessionPlanSuggestions(context: SessionPlanSuggestionContext = {}): SessionPlanSuggestions {
  const mode = context.mode ?? normalizeMode(context.preferredMode)
  const continuation = context.continuation ?? null
  const goal = defaultGoalFromContinuation(continuation)
  const suggestedStep = continuation ? suggestedStepFromContinuation(continuation) : undefined

  const defaults: SessionPlan = {
    goal,
    skill: goal === 'conversation' ? 'speaking' : 'mixed',
    durationMinutes: normalizeDuration(context.dailyGoalMinutes),
    mode,
    ...(suggestedStep ? { suggestedStep } : {}),
  }

  return {
    defaults,
    ...(continuation
      ? {
          continuationHint: {
            title: continuation.title,
            description: continuation.description,
            label: continuation.label,
          },
        }
      : {}),
  }
}

export function validateSessionPlan(input: unknown): SessionPlan {
  return sessionPlanSchema.parse(input)
}

export function parseSessionPlanHeader(value: string | null): SessionPlan | null {
  if (!value) return null
  try {
    const decoded = value.startsWith('{') ? value : Buffer.from(value, 'base64url').toString('utf8')
    const parsed = sessionPlanSchema.safeParse(JSON.parse(decoded))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function serializeSessionPlanHeader(plan: SessionPlan): string {
  return JSON.stringify(plan)
}

export function formatSessionPlanLabel(plan: SessionPlan): string {
  const goalLabel = SESSION_PLAN_GOAL_LABELS[plan.goal]
  if (plan.goal === 'practice') {
    return `${goalLabel}: ${SESSION_PLAN_SKILL_LABELS[plan.skill]}`
  }
  if (plan.suggestedStep?.label) return plan.suggestedStep.label
  return goalLabel
}

export function formatSessionPlanNextStep(plan: SessionPlan): string {
  if (plan.suggestedStep?.label) return plan.suggestedStep.label
  if (plan.goal === 'review') return 'Review due items'
  if (plan.goal === 'conversation') return 'Open conversation practice'
  if (plan.goal === 'practice') return `${SESSION_PLAN_SKILL_LABELS[plan.skill]} practice`
  return 'Continue your curriculum path'
}

const GOAL_INSTRUCTIONS: Record<SessionPlanGoal, string> = {
  continue: 'Guide the learner along their curriculum path and propose the next suitable activity.',
  review: 'Prioritize reinforcing weaker or due review items before introducing new material.',
  practice: 'Focus activities and explanations on the selected skill area.',
  conversation: 'Keep the session conversational while weaving in light corrections and vocabulary.',
}

const SKILL_INSTRUCTIONS: Record<SessionPlanSkill, string> = {
  grammar: 'Emphasize grammar explanations and form-focused checks.',
  vocabulary: 'Prioritize vocabulary building, word recall, and usage in context.',
  listening: 'Use listening and dictation-style activities when available.',
  speaking: 'Encourage spoken responses and pronunciation practice.',
  reading: 'Use reading comprehension and sentence-building activities.',
  pronunciation: 'Focus on pronunciation and oral repetition activities.',
  mixed: 'Balance activity types across the selected session goal.',
}

export function buildSessionPlanInstruction(plan: SessionPlan): string {
  const parts = [
    `Session plan: goal=${plan.goal}, skill=${plan.skill}, duration=${plan.durationMinutes} minutes, mode=${plan.mode}.`,
    GOAL_INSTRUCTIONS[plan.goal],
    SKILL_INSTRUCTIONS[plan.skill],
    `Keep the session within roughly ${plan.durationMinutes} minutes by choosing shorter activities when time is limited.`,
  ]

  if (plan.suggestedStep) {
    parts.push(
      `Suggested first step (${plan.suggestedStep.kind}${plan.suggestedStep.id ? ` id=${plan.suggestedStep.id}` : ''}): ${plan.suggestedStep.label}.`,
    )
  }

  parts.push(
    'Greet the learner briefly, then use showGrammar with a short welcome tip as structured blocks (one paragraph block) in the learning panel.',
    'Propose the first learning step according to this plan without asking the learner to choose a skill again.',
  )

  return parts.join(' ')
}

export function buildSessionPlanUpdateMessage(plan: SessionPlan): string {
  return `The learner updated their session plan. ${buildSessionPlanInstruction(plan)} Adjust the remaining session accordingly.`
}
