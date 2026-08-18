import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeTutorTool } from '@/lib/learn/execute-tutor-tool'
import { learnSessionActions, useLearnSessionStore } from '@/stores/useLearnSessionStore'
import { getPanelConflictReason } from '@/lib/learn/client-tools'

vi.mock('@/lib/analytics/events', () => ({
  trackEvent: vi.fn(),
}))

vi.mock('@/lib/learn/client-tools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/learn/client-tools')>()
  return {
    ...actual,
    showActivity: vi.fn(async (activityId: string, options?: unknown) => {
      const conflict = actual.getPanelConflictReason('showActivity')
      if (conflict) throw new Error(conflict)
      learnSessionActions.setActivity(
        {
          id: activityId,
          type: 'quiz',
          title: `Activity ${activityId}`,
          description: 'Practice activity',
          required: true,
          policy: { mode: 'score', passThreshold: 70 },
          props: { questions: [] },
        },
        'm1-ch1',
        'modulo-1',
        options as never,
      )
      return {
        success: true,
        title: `Activity ${activityId}`,
        curriculumUrl: '/curriculum/modulo-1/m1-ch1',
      }
    }),
    listChapterActivities: vi.fn(async () => ({
      chapterId: 'm1-ch1',
      chapterTitle: 'The Alphabet',
      moduleId: 'modulo-1',
      activities: [{ id: 'm1-ch1-quiz', type: 'quiz', title: 'Quiz', description: 'Test' }],
    })),
    fetchCurriculumContext: vi.fn(async () => []),
  }
})

const sampleBlocks = [
  { type: 'heading' as const, level: 2 as const, text: 'Simple Present' },
  { type: 'paragraph' as const, text: 'Use simple present for habitual actions.' },
  { type: 'example' as const, text: 'I walk to school every day.' },
]

describe('Explanation & Activity Gating', () => {
  beforeEach(() => {
    useLearnSessionStore.getState().resetSession()
    vi.clearAllMocks()
  })

  it('rejects showActivity while an explanation is active in the panel', async () => {
    // 1. Tutor presents grammar explanation
    const grammarResult = await executeTutorTool('showGrammar', {
      title: 'Grammar Focus',
      blocks: sampleBlocks,
    })
    expect(grammarResult).toContain('Grammar content displayed')
    expect(useLearnSessionStore.getState().tutorState).toBe('explaining')
    expect(useLearnSessionStore.getState().panel.kind).toBe('explanation')

    // 2. Tutor attempts to immediately show an activity before explanation is closed
    const activityResult = await executeTutorTool('showActivity', {
      activityId: 'm1-ch1-quiz',
      context: 'Practice simple present',
    })
    expect(activityResult).toContain('rejected')
    expect(activityResult).toContain('instructional explanation is currently active')

    // Explanation remains unchanged in the panel
    const storeState = useLearnSessionStore.getState()
    expect(storeState.tutorState).toBe('explaining')
    expect(storeState.panel.kind).toBe('explanation')
    if (storeState.panel.kind === 'explanation') {
      expect(storeState.panel.title).toBe('Grammar Focus')
    }
  })

  it('allows showActivity after explanation is concluded and clearPanel is called', async () => {
    // 1. Tutor explains concept
    await executeTutorTool('showGrammar', {
      title: 'Grammar Focus',
      blocks: sampleBlocks,
    })
    expect(useLearnSessionStore.getState().tutorState).toBe('explaining')

    // 2. Tutor checks learner readiness and closes the explanation
    const clearResult = await executeTutorTool('clearPanel', {})
    expect(clearResult).toBe('Panel cleared.')
    expect(useLearnSessionStore.getState().tutorState).toBe('next_step')
    expect(useLearnSessionStore.getState().panel.kind).toBe('empty')

    // 3. Tutor launches activity successfully
    const activityResult = await executeTutorTool('showActivity', {
      activityId: 'm1-ch1-quiz',
      context: 'Practice simple present',
    })
    expect(activityResult).toContain('is now visible in the learning panel')
    expect(useLearnSessionStore.getState().tutorState).toBe('activity_presented')
    expect(useLearnSessionStore.getState().panel.kind).toBe('activity')
  })

  it('supports learner clarification during explanation without losing panel state', async () => {
    // 1. Initial explanation
    await executeTutorTool('showGrammar', {
      title: 'Present Continuous',
      blocks: sampleBlocks,
    })
    expect(useLearnSessionStore.getState().panel.kind).toBe('explanation')

    // 2. Premature activity call is blocked
    const blockedActivity = await executeTutorTool('showActivity', { activityId: 'm1-ch1-quiz' })
    expect(blockedActivity).toContain('rejected')

    // 3. Learner asks a clarification question; panel state remains intact
    const panelSnapshot = JSON.parse(await executeTutorTool('getPanelState', {})) as {
      panelKind: string
      tutorState: string
      explanationTitle: string
    }
    expect(panelSnapshot.panelKind).toBe('explanation')
    expect(panelSnapshot.tutorState).toBe('explaining')
    expect(panelSnapshot.explanationTitle).toBe('Present Continuous')

    // 4. Learner confirms understanding; panel cleared -> activity launches
    await executeTutorTool('clearPanel', {})
    const successActivity = await executeTutorTool('showActivity', { activityId: 'm1-ch1-quiz' })
    expect(successActivity).toContain('is now visible')
    expect(useLearnSessionStore.getState().tutorState).toBe('activity_presented')
  })

  it('rejects showGrammar while an activity is active in the panel', async () => {
    // 1. Present activity
    await executeTutorTool('showActivity', { activityId: 'm1-ch1-quiz' })
    expect(useLearnSessionStore.getState().tutorState).toBe('activity_presented')

    // 2. Attempt to overwrite activity with grammar
    const grammarResult = await executeTutorTool('showGrammar', {
      title: 'Interruption',
      blocks: sampleBlocks,
    })
    expect(grammarResult).toContain('rejected')
    expect(grammarResult).toContain('interactive activity is active')

    // Panel still has the activity
    expect(useLearnSessionStore.getState().panel.kind).toBe('activity')
  })

  it('rejects duplicate showActivity calls when an activity is already in progress', async () => {
    // 1. Present first activity
    await executeTutorTool('showActivity', { activityId: 'm1-ch1-quiz' })
    expect(useLearnSessionStore.getState().tutorState).toBe('activity_presented')

    // 2. Attempt to present another activity
    const duplicateResult = await executeTutorTool('showActivity', { activityId: 'm1-ch1-flashcard' })
    expect(duplicateResult).toContain('rejected')
    expect(duplicateResult).toContain('already active')

    // Panel still has the original activity
    expect(useLearnSessionStore.getState().lastActivityId).toBe('m1-ch1-quiz')
  })

  it('blocks clearPanel during activity and evaluating states until completion is acknowledged', async () => {
    // 1. Present activity
    await executeTutorTool('showActivity', { activityId: 'm1-ch1-quiz' })

    // clearPanel blocked during active activity
    const clearDuringActivity = await executeTutorTool('clearPanel', {})
    expect(clearDuringActivity).toContain('activity is in progress')

    // 2. Activity completed -> evaluating state
    learnSessionActions.recordActivityResult({
      activityId: 'm1-ch1-quiz',
      scorePercent: 85,
      completedAt: new Date().toISOString(),
    })
    expect(useLearnSessionStore.getState().tutorState).toBe('evaluating')

    // clearPanel blocked while evaluating
    const clearDuringEvaluating = await executeTutorTool('clearPanel', {})
    expect(clearDuringEvaluating).toContain('cannot be cleared while evaluating')

    // 3. Tutor acknowledges and gives feedback
    learnSessionActions.acknowledgeCompletion()
    expect(useLearnSessionStore.getState().tutorState).toBe('reinforcing')

    // Now clearPanel is permitted
    const clearAfterFeedback = await executeTutorTool('clearPanel', {})
    expect(clearAfterFeedback).toBe('Panel cleared.')
  })

  it('correctly reports conflict reasons via getPanelConflictReason', () => {
    learnSessionActions.setExplanation(sampleBlocks, 'Test')
    expect(getPanelConflictReason('showActivity')).toContain('explanation is currently active')
    expect(getPanelConflictReason('showGrammar')).toBeNull()

    learnSessionActions.clearPanel()
    expect(getPanelConflictReason('showActivity')).toBeNull()

    learnSessionActions.setActivity(
      {
        id: 'act-1',
        type: 'quiz',
        title: 'Quiz',
        description: '',
        required: true,
        policy: { mode: 'score', passThreshold: 70 },
        props: {},
      },
      'ch-1',
      'mod-1',
    )
    expect(getPanelConflictReason('showActivity')).toContain('already active')
    expect(getPanelConflictReason('showGrammar')).toContain('interactive activity is active')
    expect(getPanelConflictReason('showQuestion')).toContain('interactive activity is active')
    expect(getPanelConflictReason('clearPanel')).toContain('activity is in progress')
  })
})
