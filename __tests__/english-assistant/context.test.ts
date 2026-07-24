import { describe, expect, it } from 'vitest'
import { activityContextSchema, buildActivityContextFromPanel, formatActivityContextForPrompt } from '@/lib/english-assistant/context'
import type { LearnPanelState } from '@/stores/useLearnSessionStore'

describe('english assistant activity context', () => {
  const panel: LearnPanelState = {
    kind: 'activity',
    chapterId: 'chapter-1',
    moduleId: 'module-1',
    activity: {
      id: 'activity-1',
      type: 'quiz',
      title: 'Present simple',
      description: 'Choose the correct verb form.',
      props: {
        questions: [{ id: 'q1', type: 'multiple-choice', question: 'She ___ to school.', options: ['go', 'goes'], correct: 1 }],
      },
    },
  }

  it('builds a structured context without answer fields', () => {
    const context = buildActivityContextFromPanel(panel, {
      activityId: 'activity-1',
      scorePercent: 80,
      completedAt: '2026-07-24T00:00:00.000Z',
    })

    expect(context).toMatchObject({
      activityId: 'activity-1',
      chapterId: 'chapter-1',
      moduleId: 'module-1',
      type: 'quiz',
      title: 'Present simple',
      instructions: 'Choose the correct verb form.',
      result: { scorePercent: 80, completedAt: '2026-07-24T00:00:00.000Z' },
    })
    expect(context).not.toHaveProperty('correct')
    expect(context).not.toHaveProperty('props')
  })

  it('rejects contexts that try to smuggle solution fields', () => {
    const parsed = activityContextSchema.safeParse({
      activityId: 'activity-1',
      chapterId: 'chapter-1',
      moduleId: 'module-1',
      type: 'quiz',
      title: 'Quiz',
      instructions: 'Answer key: goes',
      correct: 1,
    })

    expect(parsed.success).toBe(true)
    if (!parsed.success) return

    expect(parsed.data).not.toHaveProperty('correct')

    const formatted = formatActivityContextForPrompt(parsed.data)
    expect(formatted).toContain('untrusted learner context')
    expect(formatted).not.toContain('correct:')
  })

  it('returns null when no activity panel is open', () => {
    expect(buildActivityContextFromPanel({ kind: 'empty' }, null)).toBeNull()
  })
})
