import { beforeEach, describe, expect, it } from 'vitest'
import {
  initialLearnSessionState,
  migrateLearnSessionState,
  selectLastActivityId,
  selectPanel,
  useLearnSessionStore,
} from '@/stores/useLearnSessionStore'
import { migrateThemeState } from '@/stores/useThemeStore'

describe('learn session store boundaries', () => {
  beforeEach(() => useLearnSessionStore.getState().resetSession())

  it('keeps panel and tutor state ephemeral while migrating session markers', () => {
    const migrated = migrateLearnSessionState(
      {
        lastActivityId: 'quiz-1',
        tutorState: 'help',
        lastActivityResult: { activityId: 'quiz-1', scorePercent: 80, completedAt: '2026-01-01T00:00:00.000Z' },
      },
      0,
    )

    expect(migrated).toEqual({
      lastActivityId: 'quiz-1',
      lastActivityResult: { activityId: 'quiz-1', scorePercent: 80, completedAt: '2026-01-01T00:00:00.000Z' },
    })
    expect(initialLearnSessionState.tutorState).toBe('preparing')
  })

  it('resets malformed and future persisted payloads safely', () => {
    expect(migrateLearnSessionState({ lastActivityId: 42 }, 0)).toEqual({ lastActivityId: null, lastActivityResult: null })
    expect(migrateLearnSessionState({ lastActivityId: 'old' }, 99)).toEqual({ lastActivityId: null, lastActivityResult: null })
    expect(migrateThemeState({ dark: 'yes' }, 0)).toEqual({ dark: false })
    expect(migrateThemeState({ dark: true }, 99)).toEqual({ dark: false })
  })

  it('exposes stable selectors and resets persisted markers with the session', () => {
    useLearnSessionStore.getState().setExplanation([{ type: 'paragraph', text: 'A lesson' }])
    useLearnSessionStore.getState().recordActivityResult({
      activityId: 'quiz-1',
      scorePercent: 100,
      completedAt: '2026-01-01T00:00:00.000Z',
    })

    expect(selectPanel(useLearnSessionStore.getState())).toMatchObject({ kind: 'explanation' })
    expect(selectLastActivityId(useLearnSessionStore.getState())).toBeNull()
    useLearnSessionStore.getState().resetSession()
    expect(selectPanel(useLearnSessionStore.getState())).toEqual({ kind: 'empty' })
    expect(selectLastActivityId(useLearnSessionStore.getState())).toBeNull()
  })
})
