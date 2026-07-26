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
})
