import { describe, expect, it } from 'vitest'
import { buildTutorInstructions } from '@/lib/tutor/instructions'

describe('buildTutorInstructions', () => {
  it('includes learner context when provided', () => {
    const instructions = buildTutorInstructions({
      level: 'intermediate',
      lastChapterId: 'ch-1',
      lastActivityId: 'act-1',
    })

    expect(instructions).toContain('Learner level: intermediate.')
    expect(instructions).toContain('Last chapter studied: ch-1.')
    expect(instructions).toContain('Last activity completed: act-1.')
    expect(instructions).not.toContain('## Session plan')
  })

  it('sets the native language and recommended continuation as teaching context', () => {
    const instructions = buildTutorInstructions({
      fullName: 'Ana',
      level: 'A1',
      nativeLanguageLabel: 'Spanish',
      recommendedChapterId: 'm1-ch1',
      recommendedActivityId: 'm1-ch1-flashcards',
    })

    expect(instructions).toContain('Learner name: Ana.')
    expect(instructions).toContain('Learner native language: Spanish.')
    expect(instructions).toContain('pronunciation, say the English target naturally')
    expect(instructions).toContain('explain sounds, mouth position, stress, and corrections in the learner\'s native language')
    expect(instructions).toContain('Recommended next chapter: m1-ch1.')
    expect(instructions).toContain('Recommended next activity: m1-ch1-flashcards.')
  })
})
