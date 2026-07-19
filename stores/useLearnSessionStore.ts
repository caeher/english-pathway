import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import type { ChapterActivity } from '@/types'
import type { TutorSessionState } from '@/lib/tutor/state'

export interface ActivitySessionResult {
  activityId: string
  scorePercent: number
  completedAt: string
}

export type LearnPanelState =
  | { kind: 'empty' }
  | { kind: 'grammar'; title?: string; markdown: string }
  | { kind: 'activity'; activity: ChapterActivity; chapterId: string; moduleId: string }
  | {
      kind: 'question'
      prompt: string
      options?: string[]
      correctIndex?: number
    }

export interface LearnSessionStore {
  panel: LearnPanelState
  lastActivityId: string | null
  tutorState: TutorSessionState
  lastActivityResult: ActivitySessionResult | null
  setGrammar: (markdown: string, title?: string) => void
  setActivity: (activity: ChapterActivity, chapterId: string, moduleId: string) => void
  setQuestion: (prompt: string, options?: string[], correctIndex?: number) => void
  clearPanel: () => void
  recordActivityResult: (result: ActivitySessionResult) => void
  requestHelp: () => void
  resetSession: () => void
}

export interface LearnSessionPersistedState {
  lastActivityId: string | null
  lastActivityResult: ActivitySessionResult | null
}

export const LEARN_SESSION_PERSIST_VERSION = 1

const activityResultSchema = z.object({
  activityId: z.string().min(1),
  scorePercent: z.number().min(0).max(100),
  completedAt: z.string().min(1),
})

const persistedLearnSessionSchema = z.object({
  lastActivityId: z.string().min(1).nullable(),
  lastActivityResult: activityResultSchema.nullable(),
})

export const initialLearnSessionState: Pick<LearnSessionStore, 'panel' | 'lastActivityId' | 'tutorState' | 'lastActivityResult'> = {
  panel: { kind: 'empty' },
  lastActivityId: null,
  tutorState: 'preparing',
  lastActivityResult: null,
}

export function migrateLearnSessionState(
  persistedState: unknown,
  version: number,
): LearnSessionPersistedState {
  if (version > LEARN_SESSION_PERSIST_VERSION) {
    return { lastActivityId: null, lastActivityResult: null }
  }

  const parsed = persistedLearnSessionSchema.safeParse(persistedState)
  return parsed.success
    ? parsed.data
    : { lastActivityId: null, lastActivityResult: null }
}

export const selectPanel = (state: LearnSessionStore) => state.panel
export const selectLastActivityId = (state: LearnSessionStore) => state.lastActivityId
export const selectLastActivityResult = (state: LearnSessionStore) => state.lastActivityResult
export const selectTutorState = (state: LearnSessionStore) => state.tutorState
export const selectSetGrammar = (state: LearnSessionStore) => state.setGrammar
export const selectSetActivity = (state: LearnSessionStore) => state.setActivity
export const selectSetQuestion = (state: LearnSessionStore) => state.setQuestion
export const selectClearPanel = (state: LearnSessionStore) => state.clearPanel
export const selectRecordActivityResult = (state: LearnSessionStore) => state.recordActivityResult
export const selectRequestHelp = (state: LearnSessionStore) => state.requestHelp
export const selectResetSession = (state: LearnSessionStore) => state.resetSession

export const useLearnSessionStore = create<LearnSessionStore>()(
  persist(
    (set) => ({
      ...initialLearnSessionState,
      setGrammar: (markdown, title) => set({ panel: { kind: 'grammar', markdown, title }, tutorState: 'explaining' }),
      setActivity: (activity, chapterId, moduleId) =>
        set({
          panel: { kind: 'activity', activity, chapterId, moduleId },
          lastActivityId: activity.id,
          tutorState: 'activity_presented',
        }),
      setQuestion: (prompt, options, correctIndex) =>
        set({ panel: { kind: 'question', prompt, options, correctIndex }, tutorState: 'waiting_response' }),
      clearPanel: () => set({ panel: { kind: 'empty' }, tutorState: 'next_step' }),
      recordActivityResult: (result) => set({ tutorState: 'evaluating', lastActivityResult: result }),
      requestHelp: () => set({ tutorState: 'help' }),
      resetSession: () => set(initialLearnSessionState),
    }),
    {
      name: 'english-pathway-learn-session',
      version: LEARN_SESSION_PERSIST_VERSION,
      partialize: (state): LearnSessionPersistedState => ({
        lastActivityId: state.lastActivityId,
        lastActivityResult: state.lastActivityResult,
      }),
      migrate: migrateLearnSessionState,
    }
  )
)

export const learnSessionActions = {
  setGrammar: (markdown: string, title?: string) => useLearnSessionStore.getState().setGrammar(markdown, title),
  setActivity: (activity: ChapterActivity, chapterId: string, moduleId: string) =>
    useLearnSessionStore.getState().setActivity(activity, chapterId, moduleId),
  setQuestion: (prompt: string, options?: string[], correctIndex?: number) =>
    useLearnSessionStore.getState().setQuestion(prompt, options, correctIndex),
  clearPanel: () => useLearnSessionStore.getState().clearPanel(),
  recordActivityResult: (result: ActivitySessionResult) => useLearnSessionStore.getState().recordActivityResult(result),
  requestHelp: () => useLearnSessionStore.getState().requestHelp(),
  resetSession: () => useLearnSessionStore.getState().resetSession(),
}
