import { describe, expect, it } from 'vitest'
import { getLocalTutorMatches } from '@/lib/tutor/context'
import { formatCurriculumMatch } from '@/lib/learn/format-curriculum-match'

describe('tutor context citations', () => {
  it('includes activityId in local activity matches', () => {
    const matches = getLocalTutorMatches('alphabet mural', undefined, 'm1-ch1', 5)
    const activityMatch = matches.find((match) => match.citation.activityId)
    expect(activityMatch?.citation.activityId).toBeTruthy()
    expect(activityMatch?.citation.chunkType).toBe('activity_meta')
  })

  it('formats curriculum matches with activity IDs for the agent', () => {
    const formatted = formatCurriculumMatch({
      content: 'Activity: Quiz\nType: quiz',
      similarity: 0.91,
      metadata: {
        moduleId: 'modulo-1',
        chapterId: 'm1-ch1',
        activityId: 'm1-ch1-quiz',
        chunkType: 'activity_meta',
      },
    }, 0)
    expect(formatted).toContain('Activity ID: m1-ch1-quiz')
    expect(formatted).toContain('use with showActivity')
  })
})
