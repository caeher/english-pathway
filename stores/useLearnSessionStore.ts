import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import type { ChapterActivity } from '@/types'
import type { TutorHintContext } from '@/features/activities/hints'
import type { PanelBlock } from '@/lib/tutor/panel-content'
import { transitionTutorState, type TutorSessionState } from '@/lib/tutor/state'

import type { ActivityOutcome } from '@/lib/learn/activity-outcome'

export interface ActivitySessionResult {
  activityId: string
  scorePercent: number
  completedAt: string
}

export type LearnPanelState =
  | { kind: 'empty' }
  | { kind: 'explanation'; title?: string; blocks: PanelBlock[] }
  | {
      kind: 'activity'
      activity: ChapterActivity
      chapterId: string
      moduleId: string
      context?: string
      expectedAction?: string
    }
  | {
      kind: 'question'
      prompt: string
      options?: string[]
      correctIndex?: number
    }

export interface HintFallbackRequest {
  message: string
  context: TutorHintContext
}

export interface LearnSessionStore {
  panel: LearnPanelState
  panelNotice: string | null
  lastActivityId: string | null
  tutorState: TutorSessionState
  lastActivityResult: ActivitySessionResult | null
  lastActivityOutcome: ActivityOutcome | null
  hintFallbackRequest: HintFallbackRequest | null
  setExplanation: (blocks: PanelBlock[], title?: string) => void
  setPanelNotice: (notice: string | null) => void
  setActivity: (
    activity: ChapterActivity,
    chapterId: string,
    moduleId: string,
    options?: { context?: string; expectedAction?: string },
  ) => void
  setQuestion: (prompt: string, options?: string[], correctIndex?: number) => void
  clearPanel: () => void
  recordActivityResult: (result: ActivitySessionResult) => void
  recordActivityOutcome: (outcome: ActivityOutcome) => void
  acknowledgeCompletion: () => void
  requestHelp: () => void
  setHintFallbackRequest: (request: HintFallbackRequest | null) => void
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

export const initialLearnSessionState: Pick<
  LearnSessionStore,
  | 'panel'
  | 'panelNotice'
  | 'lastActivityId'
  | 'tutorState'
  | 'lastActivityResult'
  | 'lastActivityOutcome'
  | 'hintFallbackRequest'
> = {
  panel: { kind: 'empty' },
  panelNotice: null,
  lastActivityId: null,
  tutorState: 'preparing',
  lastActivityResult: null,
  lastActivityOutcome: null,
  hintFallbackRequest: null,
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
export const selectPanelNotice = (state: LearnSessionStore) => state.panelNotice
export const selectLastActivityId = (state: LearnSessionStore) => state.lastActivityId
export const selectLastActivityResult = (state: LearnSessionStore) => state.lastActivityResult
export const selectLastActivityOutcome = (state: LearnSessionStore) => state.lastActivityOutcome
export const selectTutorState = (state: LearnSessionStore) => state.tutorState
export const selectSetExplanation = (state: LearnSessionStore) => state.setExplanation
export const selectSetActivity = (state: LearnSessionStore) => state.setActivity
export const selectSetQuestion = (state: LearnSessionStore) => state.setQuestion
export const selectClearPanel = (state: LearnSessionStore) => state.clearPanel
export const selectRecordActivityResult = (state: LearnSessionStore) => state.recordActivityResult
export const selectRecordActivityOutcome = (state: LearnSessionStore) => state.recordActivityOutcome
export const selectRequestHelp = (state: LearnSessionStore) => state.requestHelp
export const selectHintFallbackRequest = (state: LearnSessionStore) => state.hintFallbackRequest
export const selectSetHintFallbackRequest = (state: LearnSessionStore) => state.setHintFallbackRequest
export const selectResetSession = (state: LearnSessionStore) => state.resetSession

export const useLearnSessionStore = create<LearnSessionStore>()(
  persist(
    (set) => ({
      ...initialLearnSessionState,
      setExplanation: (blocks, title) =>
        set((state) => {
          if (state.tutorState === 'activity_presented') return state
          return {
            panel: { kind: 'explanation', blocks, title },
            panelNotice: null,
            tutorState: transitionTutorState(state.tutorState, { type: 'explanation_shown' }),
          }
        }),
      setPanelNotice: (notice) => set({ panelNotice: notice }),
      setActivity: (activity, chapterId, moduleId, options) =>
        set((state) => {
          if (state.tutorState === 'explaining') return state
          return {
            panel: {
              kind: 'activity',
              activity,
              chapterId,
              moduleId,
              context: options?.context,
              expectedAction: options?.expectedAction,
            },
            panelNotice: null,
            lastActivityId: activity.id,
            tutorState: transitionTutorState(state.tutorState, { type: 'activity_presented' }),
          }
        }),
      setQuestion: (prompt, options, correctIndex) =>
        set((state) => {
          if (state.tutorState === 'activity_presented') return state
          return {
            panel: { kind: 'question', prompt, options, correctIndex },
            panelNotice: null,
            tutorState: transitionTutorState(state.tutorState, { type: 'answer_requested' }),
          }
        }),
      clearPanel: () =>
        set((state) => ({
          panel: { kind: 'empty' },
          panelNotice: null,
          tutorState: transitionTutorState(state.tutorState, { type: 'panel_cleared' }),
        })),
      recordActivityResult: (result) =>
        set((state) => ({
          tutorState: transitionTutorState(state.tutorState, { type: 'activity_result', scorePercent: result.scorePercent }),
          lastActivityResult: result,
        })),
      recordActivityOutcome: (outcome) =>
        set((state) => ({
          tutorState: transitionTutorState(state.tutorState, {
            type: 'activity_outcome',
            status: outcome.status,
            scorePercent: outcome.scorePercent,
          }),
          lastActivityOutcome: outcome,
          lastActivityResult: outcome.status === 'completed' && typeof outcome.scorePercent === 'number'
            ? { activityId: outcome.activityId, scorePercent: outcome.scorePercent, completedAt: new Date().toISOString() }
            : state.lastActivityResult,
        })),
      acknowledgeCompletion: () =>
        set((state) => ({
          tutorState: transitionTutorState(state.tutorState, { type: 'continue' }),
        })),
      requestHelp: () =>
        set((state) => ({
          tutorState: transitionTutorState(state.tutorState, { type: 'help_requested' }),
        })),
      setHintFallbackRequest: (request) => set({ hintFallbackRequest: request }),
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
  setExplanation: (blocks: PanelBlock[], title?: string) =>
    useLearnSessionStore.getState().setExplanation(blocks, title),
  setPanelNotice: (notice: string | null) => useLearnSessionStore.getState().setPanelNotice(notice),
  setActivity: (
    activity: ChapterActivity,
    chapterId: string,
    moduleId: string,
    options?: { context?: string; expectedAction?: string },
  ) =>
    useLearnSessionStore.getState().setActivity(activity, chapterId, moduleId, options),
  setQuestion: (prompt: string, options?: string[], correctIndex?: number) =>
    useLearnSessionStore.getState().setQuestion(prompt, options, correctIndex),
  clearPanel: () => useLearnSessionStore.getState().clearPanel(),
  recordActivityResult: (result: ActivitySessionResult) => useLearnSessionStore.getState().recordActivityResult(result),
  recordActivityOutcome: (outcome: ActivityOutcome) => useLearnSessionStore.getState().recordActivityOutcome(outcome),
  acknowledgeCompletion: () => useLearnSessionStore.getState().acknowledgeCompletion(),
  requestHelp: () => useLearnSessionStore.getState().requestHelp(),
  setHintFallbackRequest: (request: HintFallbackRequest | null) =>
    useLearnSessionStore.getState().setHintFallbackRequest(request),
  resetSession: () => useLearnSessionStore.getState().resetSession(),
}
