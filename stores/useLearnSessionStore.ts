import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

interface LearnSessionStore {
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
}

export const useLearnSessionStore = create<LearnSessionStore>()(
  persist(
    (set) => ({
      panel: { kind: 'empty' },
      lastActivityId: null,
      tutorState: 'preparing',
      lastActivityResult: null,
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
    }),
    {
      name: 'english-pathway-learn-session',
      partialize: (state) => ({
        lastActivityId: state.lastActivityId,
        tutorState: state.tutorState,
        lastActivityResult: state.lastActivityResult,
      }),
    }
  )
)
