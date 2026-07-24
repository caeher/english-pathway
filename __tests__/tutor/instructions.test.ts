import { describe, expect, it } from 'vitest'
import { DomainError } from '@/lib/api/errors'
import { parseSessionPlanQuery } from '@/features/tutor/use-cases'
import { buildTutorInstructions } from '@/lib/tutor/instructions'
import { validateSessionPlan } from '@/lib/learn/session-plan'

describe('parseSessionPlanQuery', () => {
  it('parses and normalizes mode from query params', () => {
    const plan = parseSessionPlanQuery(JSON.stringify({
      goal: 'continue',
      skill: 'mixed',
      durationMinutes: 15,
      mode: 'text',
    }), 'voice')

    expect(plan).toEqual(validateSessionPlan({
      goal: 'continue',
      skill: 'mixed',
      durationMinutes: 15,
      mode: 'voice',
    }))
  })

  it('rejects malformed plan payloads', () => {
    expect(() => parseSessionPlanQuery('{bad json}', 'text')).toThrow(DomainError)
  })
})

describe('buildTutorInstructions', () => {
  it('includes validated session plan details', () => {
    const instructions = buildTutorInstructions({
      level: 'intermediate',
      plan: validateSessionPlan({
        goal: 'review',
        skill: 'mixed',
        durationMinutes: 10,
        mode: 'voice',
      }),
    })

    expect(instructions).toContain('Learner level: intermediate.')
    expect(instructions).toContain('## Session plan')
    expect(instructions).toContain('goal=review')
  })
})
