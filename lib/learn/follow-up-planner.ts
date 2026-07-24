import type { ActivityCorrectness } from '@/lib/games/result'
import { pickNextActivityId } from '@/lib/learn/next-activity'

export type FollowUpAction = 'retry' | 'reinforce' | 'variant' | 'advance' | 'chapter-complete'

export interface ChapterActivityRef {
  id: string
  type: string
  title: string
}

export interface FollowUpTutorPayload {
  action: FollowUpAction
  activityId: string | null
  scorePercent: number
  attempt: number
  weakItemCount: number
  hintCount: number
}

export interface FollowUpDecision {
  action: FollowUpAction
  activityId: string | null
  activityTitle: string | null
  reason: string
  tutorPayload: FollowUpTutorPayload
}

export interface PlanFollowUpInput {
  currentActivityId: string
  currentActivityType: string
  correctness: ActivityCorrectness
  scorePercent: number
  weakItemIndexes: readonly number[]
  attempt: number
  hintCount: number
  chapterActivities: readonly ChapterActivityRef[]
  completedActivityIds: ReadonlySet<string>
}

const REINFORCEMENT_TYPES: Record<string, readonly string[]> = {
  quiz: ['flashcard', 'word-match'],
  flashcard: ['quiz', 'word-match'],
  'word-match': ['flashcard', 'word-scramble'],
  'word-scramble': ['word-match', 'flashcard'],
  listening: ['dictation', 'flashcard'],
  dictation: ['listening', 'word-scramble'],
  pronunciation: ['listening', 'flashcard'],
  'sentence-builder': ['drag-drop', 'word-scramble'],
  'drag-drop': ['sentence-builder', 'word-match'],
}

const SIMPLER_TYPES: readonly string[] = ['flashcard', 'word-match', 'quiz']

export function validateFollowUpActivityId(
  activityId: string | null,
  chapterActivities: readonly ChapterActivityRef[],
): boolean {
  if (!activityId) return false
  return chapterActivities.some((activity) => activity.id === activityId)
}

function findActivity(
  chapterActivities: readonly ChapterActivityRef[],
  activityId: string | null,
): ChapterActivityRef | null {
  if (!activityId) return null
  return chapterActivities.find((activity) => activity.id === activityId) ?? null
}

function pickByPreferredTypes(
  chapterActivities: readonly ChapterActivityRef[],
  currentActivityId: string,
  preferredTypes: readonly string[],
  completedActivityIds: ReadonlySet<string>,
): string | null {
  for (const type of preferredTypes) {
    const match = chapterActivities.find(
      (activity) =>
        activity.id !== currentActivityId
        && activity.type === type
        && !completedActivityIds.has(activity.id),
    )
    if (match) return match.id
  }
  return null
}

function pickReinforcementActivity(
  chapterActivities: readonly ChapterActivityRef[],
  currentActivityId: string,
  currentActivityType: string,
  completedActivityIds: ReadonlySet<string>,
): string | null {
  const preferredTypes = REINFORCEMENT_TYPES[currentActivityType] ?? ['flashcard', 'quiz']
  const reinforcement = pickByPreferredTypes(
    chapterActivities,
    currentActivityId,
    preferredTypes,
    completedActivityIds,
  )
  if (reinforcement) return reinforcement

  return pickNextActivityId(
    chapterActivities,
    currentActivityId,
    (id) => completedActivityIds.has(id),
  )
}

function pickSimplerVariant(
  chapterActivities: readonly ChapterActivityRef[],
  currentActivityId: string,
  completedActivityIds: ReadonlySet<string>,
): string | null {
  const simpler = pickByPreferredTypes(
    chapterActivities,
    currentActivityId,
    SIMPLER_TYPES,
    completedActivityIds,
  )
  if (simpler) return simpler

  return pickNextActivityId(
    chapterActivities,
    currentActivityId,
    (id) => completedActivityIds.has(id),
  )
}

function buildDecision(
  input: PlanFollowUpInput,
  action: FollowUpAction,
  activityId: string | null,
  reason: string,
): FollowUpDecision {
  const activity = findActivity(input.chapterActivities, activityId)
  return {
    action,
    activityId: activity ? activity.id : null,
    activityTitle: activity?.title ?? null,
    reason,
    tutorPayload: {
      action,
      activityId: activity ? activity.id : null,
      scorePercent: input.scorePercent,
      attempt: input.attempt,
      weakItemCount: input.weakItemIndexes.length,
      hintCount: input.hintCount,
    },
  }
}

export function planFollowUpPractice(input: PlanFollowUpInput): FollowUpDecision {
  const {
    currentActivityId,
    currentActivityType,
    correctness,
    weakItemIndexes,
    attempt,
    hintCount,
    chapterActivities,
    completedActivityIds,
  } = input

  if (correctness === 'complete') {
    const nextId = pickNextActivityId(
      chapterActivities,
      currentActivityId,
      (id) => completedActivityIds.has(id),
    )
    if (!nextId) {
      return buildDecision(
        input,
        'chapter-complete',
        null,
        'You have completed every activity in this chapter.',
      )
    }
    const nextActivity = findActivity(chapterActivities, nextId)
    return buildDecision(
      input,
      'advance',
      nextId,
      nextActivity
        ? `Continue to "${nextActivity.title}" to keep building momentum.`
        : 'Continue to the next activity.',
    )
  }

  if (correctness === 'partial') {
    const reinforceId = pickReinforcementActivity(
      chapterActivities,
      currentActivityId,
      currentActivityType,
      completedActivityIds,
    )
    if (!reinforceId) {
      const nextId = pickNextActivityId(
        chapterActivities,
        currentActivityId,
        (id) => completedActivityIds.has(id),
      )
      if (!nextId) {
        return buildDecision(
          input,
          'chapter-complete',
          null,
          'You have completed every activity in this chapter.',
        )
      }
      const nextActivity = findActivity(chapterActivities, nextId)
      return buildDecision(
        input,
        'advance',
        nextId,
        nextActivity
          ? `Continue to "${nextActivity.title}" when you are ready.`
          : 'Continue to the next activity when you are ready.',
      )
    }
    const reinforceActivity = findActivity(chapterActivities, reinforceId)
    const weakNote = weakItemIndexes.length > 0
      ? `${weakItemIndexes.length} item${weakItemIndexes.length === 1 ? '' : 's'} need more practice.`
      : 'Some answers could be stronger.'
    return buildDecision(
      input,
      'reinforce',
      reinforceId,
      reinforceActivity
        ? `${weakNote} Practice with "${reinforceActivity.title}" to reinforce this skill.`
        : `${weakNote} Try a related practice activity to reinforce this skill.`,
    )
  }

  const shouldTryVariant = attempt >= 3 || hintCount >= 2
  if (shouldTryVariant) {
    const variantId = pickSimplerVariant(
      chapterActivities,
      currentActivityId,
      completedActivityIds,
    )
    if (variantId && variantId !== currentActivityId) {
      const variantActivity = findActivity(chapterActivities, variantId)
      return buildDecision(
        input,
        'variant',
        variantId,
        variantActivity
          ? `Try "${variantActivity.title}" for a different angle on this skill.`
          : 'Try a different practice activity for a fresh approach.',
      )
    }
  }

  if (attempt < 3) {
    const currentActivity = findActivity(chapterActivities, currentActivityId)
    return buildDecision(
      input,
      'retry',
      currentActivityId,
      currentActivity
        ? `Try "${currentActivity.title}" again to strengthen this skill.`
        : 'Try this activity again to strengthen this skill.',
    )
  }

  const fallbackId = pickNextActivityId(
    chapterActivities,
    currentActivityId,
    (id) => completedActivityIds.has(id),
  )
  if (!fallbackId) {
    return buildDecision(
      input,
      'chapter-complete',
      null,
      'You have completed every activity in this chapter.',
    )
  }
  const fallbackActivity = findActivity(chapterActivities, fallbackId)
  return buildDecision(
    input,
    'advance',
    fallbackId,
    fallbackActivity
      ? `Move on to "${fallbackActivity.title}" and come back to this later.`
      : 'Move on to the next activity and come back to this later.',
  )
}

export function formatFollowUpTutorMessage(decision: FollowUpDecision): string {
  const { tutorPayload, activityId, activityTitle } = decision
  const target = activityTitle ?? activityId ?? 'none'
  return [
    'Follow-up decision:',
    tutorPayload.action,
    `activity ${target}`,
    `score ${tutorPayload.scorePercent}%`,
    `attempt ${tutorPayload.attempt}`,
    `weak items ${tutorPayload.weakItemCount}`,
    `hints used ${tutorPayload.hintCount}`,
    `reason: ${decision.reason}`,
  ].join(' | ')
}
