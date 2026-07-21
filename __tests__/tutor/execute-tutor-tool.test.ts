import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeTutorTool } from '@/lib/learn/execute-tutor-tool'
import { learnSessionActions, useLearnSessionStore } from '@/stores/useLearnSessionStore'

vi.mock('@/lib/analytics/events', () => ({
  trackEvent: vi.fn(),
}))

vi.mock('@/lib/learn/client-tools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/learn/client-tools')>()
  return {
    ...actual,
    showActivity: vi.fn(async (activityId: string) => ({
      success: true,
      title: `Activity ${activityId}`,
      curriculumUrl: '/curriculum/modulo-1/m1-ch1',
    })),
    listChapterActivities: vi.fn(async () => ({
      chapterId: 'm1-ch1',
      chapterTitle: 'The Alphabet',
      moduleId: 'modulo-1',
      activities: [{ id: 'm1-ch1-quiz', type: 'quiz', title: 'Quiz', description: 'Test' }],
    })),
    fetchCurriculumContext: vi.fn(async () => []),
  }
})

describe('executeTutorTool', () => {
  beforeEach(() => {
    learnSessionActions.resetSession()
    vi.clearAllMocks()
  })

  it('shows grammar in the panel', async () => {
    const result = await executeTutorTool('showGrammar', { title: 'Tips', markdown: 'Use **a** before consonant sounds.' })
    expect(result).toContain('Grammar content displayed')
    expect(useLearnSessionStore.getState().panel).toEqual({
      kind: 'grammar',
      title: 'Tips',
      markdown: 'Use **a** before consonant sounds.',
    })
    expect(useLearnSessionStore.getState().tutorState).toBe('explaining')
  })

  it('rejects invalid activity IDs', async () => {
    const result = await executeTutorTool('showActivity', { activityId: '' })
    expect(result).toContain('rejected')
    expect(useLearnSessionStore.getState().panel.kind).toBe('empty')
  })

  it('returns panel state snapshot', async () => {
    learnSessionActions.setQuestion('What is A?', ['Apple', 'Banana'], 0)
    const result = await executeTutorTool('getPanelState', {})
    const parsed = JSON.parse(result) as { panelKind: string; tutorState: string }
    expect(parsed.panelKind).toBe('question')
    expect(parsed.tutorState).toBe('waiting_response')
  })

  it('blocks clearPanel while evaluating', async () => {
    learnSessionActions.recordActivityResult({ activityId: 'm1-ch1-quiz', scorePercent: 50, completedAt: new Date().toISOString() })
    const result = await executeTutorTool('clearPanel', {})
    expect(result).toContain('cannot be cleared')
    expect(useLearnSessionStore.getState().tutorState).toBe('evaluating')
  })
})
