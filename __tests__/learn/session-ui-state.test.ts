import { describe, expect, it } from 'vitest'
import {
  resolveSessionUiState,
  resolveSessionVisualState,
  shouldExpandEngagementMetrics,
  type SessionUiContext,
} from '@/lib/learn/session-ui-state'
import type { LearnPanelState } from '@/stores/useLearnSessionStore'

const emptyPanel: LearnPanelState = { kind: 'empty' }

const activityPanel: LearnPanelState = {
  kind: 'activity',
  activity: {
    id: 'act-1',
    type: 'quiz',
    title: 'Greetings quiz',
    description: 'Practice greetings',
    props: {},
  },
  chapterId: 'ch-1',
  moduleId: 'mod-1',
}

function baseContext(overrides: Partial<SessionUiContext> = {}): SessionUiContext {
  return {
    sessionMode: 'text',
    tutorActive: false,
    tutorConnecting: false,
    tutorState: 'preparing',
    panel: emptyPanel,
    activityPhase: null,
    questionAnswered: false,
    continuation: null,
    completionScorePercent: null,
    ...overrides,
  }
}

describe('resolveSessionVisualState', () => {
  it('returns pre_session when tutor is idle and panel is empty', () => {
    expect(resolveSessionVisualState(baseContext())).toBe('pre_session')
  })

  it('returns connecting when tutor is connecting without active practice', () => {
    expect(resolveSessionVisualState(baseContext({ tutorConnecting: true }))).toBe('connecting')
  })

  it('prioritizes active_practice over connecting when panel has an activity', () => {
    expect(resolveSessionVisualState(baseContext({
      tutorConnecting: true,
      panel: activityPanel,
      activityPhase: 'playing',
    }))).toBe('active_practice')
  })

  it('returns active_practice for grammar and question panels', () => {
    expect(resolveSessionVisualState(baseContext({
      panel: { kind: 'grammar', markdown: '# Tip', title: 'Welcome tip' },
    }))).toBe('active_practice')

    expect(resolveSessionVisualState(baseContext({
      panel: { kind: 'question', prompt: 'Pick one' },
    }))).toBe('active_practice')
  })

  it('returns feedback when tutor is evaluating or help is requested', () => {
    expect(resolveSessionVisualState(baseContext({ tutorState: 'evaluating' }))).toBe('feedback')
    expect(resolveSessionVisualState(baseContext({ tutorState: 'help' }))).toBe('feedback')
    expect(resolveSessionVisualState(baseContext({ questionAnswered: true }))).toBe('feedback')
  })

  it('returns completed when activity phase is completed', () => {
    expect(resolveSessionVisualState(baseContext({
      panel: activityPanel,
      activityPhase: 'completed',
      completionScorePercent: 92,
    }))).toBe('completed')
  })

  it('prioritizes completed over feedback signals', () => {
    expect(resolveSessionVisualState(baseContext({
      panel: activityPanel,
      activityPhase: 'completed',
      tutorState: 'evaluating',
      questionAnswered: true,
    }))).toBe('completed')
  })
})

describe('resolveSessionUiState', () => {
  it('builds labels for all five visual states', () => {
    const states = [
      resolveSessionUiState(baseContext()),
      resolveSessionUiState(baseContext({ tutorConnecting: true })),
      resolveSessionUiState(baseContext({
        tutorActive: true,
        panel: activityPanel,
        activityPhase: 'playing',
      })),
      resolveSessionUiState(baseContext({ tutorState: 'evaluating' })),
      resolveSessionUiState(baseContext({
        panel: activityPanel,
        activityPhase: 'completed',
        completionScorePercent: 88,
      })),
    ]

    expect(states.map((snapshot) => snapshot.state)).toEqual([
      'pre_session',
      'connecting',
      'active_practice',
      'feedback',
      'completed',
    ])
    expect(states.every((snapshot) => snapshot.objectiveLabel.length > 0)).toBe(true)
    expect(states.every((snapshot) => snapshot.nextActionLabel.length > 0)).toBe(true)
  })

  it('uses continuation data in pre_session', () => {
    const snapshot = resolveSessionUiState(baseContext({
      continuation: {
        kind: 'resume',
        title: 'Module 1 · Greetings',
        description: 'Pick up where you left off.',
        label: 'Resume',
        href: '/learn?activityId=act-1',
      },
    }))

    expect(snapshot.objectiveLabel).toBe('Module 1 · Greetings')
    expect(snapshot.nextActionLabel).toBe('Resume')
    expect(snapshot.statusDetail).toBe('Pick up where you left off.')
  })

  it('shows voice mode when tutor session is active', () => {
    const snapshot = resolveSessionUiState(baseContext({
      sessionMode: 'voice',
      tutorActive: true,
    }))

    expect(snapshot.modeLabel).toBe('Voice')
  })
})

describe('shouldExpandEngagementMetrics', () => {
  it('expands only before and after practice', () => {
    expect(shouldExpandEngagementMetrics('pre_session')).toBe(true)
    expect(shouldExpandEngagementMetrics('completed')).toBe(true)
    expect(shouldExpandEngagementMetrics('active_practice')).toBe(false)
    expect(shouldExpandEngagementMetrics('feedback')).toBe(false)
    expect(shouldExpandEngagementMetrics('connecting')).toBe(false)
  })
})
