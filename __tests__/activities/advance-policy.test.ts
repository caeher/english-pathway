import { describe, expect, it } from 'vitest'
import {
  COMPLETION_MODE_ACTIVITY_TYPES,
  DEFAULT_PASS_THRESHOLD,
  parseChapterActivitiesFile,
  resolveActivityAdvanceFields,
  resolveActivityAdvancePolicy,
} from '@/features/activities/advance-policy'

describe('advance policy', () => {
  it('defaults score mode to 70%', () => {
    expect(resolveActivityAdvancePolicy({ mode: 'score' })).toEqual({
      mode: 'score',
      passThreshold: DEFAULT_PASS_THRESHOLD,
    })
  })

  it('parses wrapped activities files', () => {
    const parsed = parseChapterActivitiesFile({
      policyVersion: 1,
      activities: [{ id: 'a', type: 'quiz' }],
    })
    expect(parsed.policyVersion).toBe(1)
    expect(parsed.activities).toHaveLength(1)
  })

  it('resolves required default to true', () => {
    expect(resolveActivityAdvanceFields({}).required).toBe(true)
  })

  it('lists activity types that default to completion mode', () => {
    expect(COMPLETION_MODE_ACTIVITY_TYPES).toContain('flashcard')
  })
})
