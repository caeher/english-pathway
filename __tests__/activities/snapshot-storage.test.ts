import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ACTIVITY_SNAPSHOT_STORAGE_KEY,
  loadSnapshot,
  migrateSnapshotStore,
  purgeExpiredSnapshots,
  removeSnapshot,
  saveSnapshot,
  SNAPSHOT_TTL_MS,
} from '@/lib/storage/activity-snapshot'

function createStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => { store.clear() },
  }
}

const quizPayload = {
  current: 2,
  selected: 1,
  fillValue: '',
  answered: true,
  score: 1,
  weakItemIndexes: [0],
}

describe('activity snapshot storage', () => {
  beforeEach(() => {
    const storage = createStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('window', { localStorage: storage })
    storage.clear()
    vi.useRealTimers()
  })

  it('migrates malformed and future store versions safely', () => {
    expect(migrateSnapshotStore(null)).toEqual({ version: 1, snapshots: {} })
    expect(migrateSnapshotStore({ version: 99, snapshots: {} })).toEqual({ version: 1, snapshots: {} })
    expect(migrateSnapshotStore({ version: 1, snapshots: { bad: 'value' } })).toEqual({ version: 1, snapshots: {} })
  })

  it('saves and loads a valid snapshot', () => {
    saveSnapshot({
      version: 1,
      activityId: 'quiz-1',
      activityType: 'quiz',
      payload: quizPayload,
    })

    const loaded = loadSnapshot('quiz-1')
    expect(loaded?.activityId).toBe('quiz-1')
    expect(loaded?.activityType).toBe('quiz')
    expect(loaded?.payload).toEqual(quizPayload)
  })

  it('discards corrupt payloads and removes the entry', () => {
    localStorage.setItem(
      ACTIVITY_SNAPSHOT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        snapshots: {
          'quiz-1': {
            version: 1,
            activityId: 'quiz-1',
            activityType: 'quiz',
            savedAt: new Date().toISOString(),
            payload: { current: -1 },
          },
        },
      }),
    )

    expect(loadSnapshot('quiz-1')).toBeNull()
    expect(localStorage.getItem(ACTIVITY_SNAPSHOT_STORAGE_KEY)).toContain('"snapshots":{}')
  })

  it('discards expired snapshots during load and purge', () => {
    vi.useFakeTimers()
    const now = new Date('2026-07-23T12:00:00.000Z')
    vi.setSystemTime(now)

    saveSnapshot({
      version: 1,
      activityId: 'quiz-1',
      activityType: 'quiz',
      savedAt: new Date(now.getTime() - SNAPSHOT_TTL_MS - 1).toISOString(),
      payload: quizPayload,
    })

    expect(loadSnapshot('quiz-1')).toBeNull()

    saveSnapshot({
      version: 1,
      activityId: 'quiz-2',
      activityType: 'quiz',
      savedAt: new Date(now.getTime() - SNAPSHOT_TTL_MS - 1).toISOString(),
      payload: quizPayload,
    })

    purgeExpiredSnapshots(now.getTime())
    expect(loadSnapshot('quiz-2')).toBeNull()
  })

  it('removes snapshots explicitly', () => {
    saveSnapshot({
      version: 1,
      activityId: 'quiz-1',
      activityType: 'quiz',
      payload: quizPayload,
    })

    removeSnapshot('quiz-1')
    expect(loadSnapshot('quiz-1')).toBeNull()
  })
})
