import { describe, expect, it } from 'vitest'
import {
  buildSessionPlanInstruction,
  buildSessionPlanSuggestions,
  buildSessionPlanUpdateMessage,
  formatSessionPlanLabel,
  formatSessionPlanNextStep,
  parseSessionPlanHeader,
  sessionPlanSchema,
  validateSessionPlan,
} from '@/lib/learn/session-plan'

describe('session plan contract', () => {
  it('validates a complete session plan', () => {
    const plan = validateSessionPlan({
      goal: 'practice',
      skill: 'grammar',
      durationMinutes: 10,
      mode: 'text',
      suggestedStep: { kind: 'activity', id: 'act-1', label: 'Greetings quiz' },
    })

    expect(sessionPlanSchema.parse(plan)).toEqual(plan)
  })

  it('rejects invalid goals and durations', () => {
    expect(sessionPlanSchema.safeParse({
      goal: 'invalid',
      skill: 'grammar',
      durationMinutes: 10,
      mode: 'text',
    }).success).toBe(false)
    expect(sessionPlanSchema.safeParse({
      goal: 'practice',
      skill: 'grammar',
      durationMinutes: 12,
      mode: 'text',
    }).success).toBe(false)
  })
})

describe('buildSessionPlanSuggestions', () => {
  it('defaults to continue when continuation is resume', () => {
    const result = buildSessionPlanSuggestions({
      continuation: {
        kind: 'resume',
        href: '/learn?moduleId=m1&chapterId=c1&activityId=a1',
        label: 'Resume learning',
        title: 'Continue where you left off',
        description: 'Return to your next activity.',
        target: { moduleId: 'm1', chapterId: 'c1', activityId: 'a1' },
      },
      dailyGoalMinutes: 15,
      preferredMode: 'voice',
    })

    expect(result.defaults.goal).toBe('continue')
    expect(result.defaults.durationMinutes).toBe(15)
    expect(result.defaults.mode).toBe('voice')
    expect(result.defaults.suggestedStep).toEqual({
      kind: 'activity',
      id: 'a1',
      label: 'Continue where you left off',
    })
    expect(result.continuationHint?.label).toBe('Resume learning')
  })

  it('defaults to review when continuation is review', () => {
    const result = buildSessionPlanSuggestions({
      continuation: {
        kind: 'review',
        href: '/review',
        label: 'Review 2 due',
        title: 'Two reviews are due',
        description: 'Strengthen previous learning.',
      },
    })

    expect(result.defaults.goal).toBe('review')
    expect(result.defaults.suggestedStep?.kind).toBe('review')
  })

  it('falls back to practice for guests', () => {
    const result = buildSessionPlanSuggestions()
    expect(result.defaults.goal).toBe('practice')
    expect(result.defaults.skill).toBe('mixed')
    expect(result.defaults.durationMinutes).toBe(10)
  })
})

describe('session plan formatting', () => {
  const plan = validateSessionPlan({
    goal: 'practice',
    skill: 'vocabulary',
    durationMinutes: 20,
    mode: 'voice',
  })

  it('formats labels and next steps', () => {
    expect(formatSessionPlanLabel(plan)).toBe('Practice a skill: Vocabulary')
    expect(formatSessionPlanNextStep(plan)).toBe('Vocabulary practice')
  })

  it('builds tutor instructions without asking for free-form skill choice', () => {
    const instruction = buildSessionPlanInstruction(plan)
    expect(instruction).toContain('goal=practice')
    expect(instruction).toContain('skill=vocabulary')
    expect(instruction).toContain('without asking the learner to choose a skill again')
  })

  it('builds update messages for mid-session edits', () => {
    expect(buildSessionPlanUpdateMessage(plan)).toContain('updated their session plan')
  })
})

describe('parseSessionPlanHeader', () => {
  it('parses JSON headers and rejects invalid payloads', () => {
    const plan = validateSessionPlan({
      goal: 'conversation',
      skill: 'speaking',
      durationMinutes: 5,
      mode: 'voice',
    })
    expect(parseSessionPlanHeader(JSON.stringify(plan))).toEqual(plan)
    expect(parseSessionPlanHeader('not-json')).toBeNull()
  })
})
