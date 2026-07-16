import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChapterActivity } from '@/types'

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
  setGrammar: (markdown: string, title?: string) => void
  setActivity: (activity: ChapterActivity, chapterId: string, moduleId: string) => void
  setQuestion: (prompt: string, options?: string[], correctIndex?: number) => void
  clearPanel: () => void
}

export const useLearnSessionStore = create<LearnSessionStore>()(
  persist(
    (set) => ({
      panel: { kind: 'empty' },
      lastActivityId: null,
      setGrammar: (markdown, title) => set({ panel: { kind: 'grammar', markdown, title } }),
      setActivity: (activity, chapterId, moduleId) =>
        set({
          panel: { kind: 'activity', activity, chapterId, moduleId },
          lastActivityId: activity.id,
        }),
      setQuestion: (prompt, options, correctIndex) =>
        set({ panel: { kind: 'question', prompt, options, correctIndex } }),
      clearPanel: () => set({ panel: { kind: 'empty' } }),
    }),
    {
      name: 'english-pathway-learn-session',
      partialize: (state) => ({
        lastActivityId: state.lastActivityId,
      }),
    }
  )
)
