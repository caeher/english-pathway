'use client'

import { create } from 'zustand'
import {
  buildSessionPlanSuggestions,
  SESSION_PLAN_STORAGE_KEY,
  type SessionPlan,
  type SessionPlanSuggestions,
  validateSessionPlan,
} from '@/lib/learn/session-plan'

export type SessionPlanStatus = 'idle' | 'loading' | 'ready' | 'error'

interface SessionPlanStore {
  plan: SessionPlan | null
  suggestions: SessionPlanSuggestions | null
  status: SessionPlanStatus
  setPlan: (plan: SessionPlan) => void
  updatePlan: (partial: Partial<SessionPlan>) => void
  loadSuggestions: (mode?: SessionPlan['mode']) => Promise<void>
  hydrateFromStorage: (mode?: SessionPlan['mode']) => void
  clearPlan: () => void
}

function persistPlan(plan: SessionPlan | null) {
  if (typeof window === 'undefined') return
  if (!plan) {
    sessionStorage.removeItem(SESSION_PLAN_STORAGE_KEY)
    return
  }
  sessionStorage.setItem(SESSION_PLAN_STORAGE_KEY, JSON.stringify(plan))
}

function readStoredPlan(): SessionPlan | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(SESSION_PLAN_STORAGE_KEY)
  if (!raw) return null
  try {
    return validateSessionPlan(JSON.parse(raw))
  } catch {
    return null
  }
}

export const useSessionPlanStore = create<SessionPlanStore>((set, get) => ({
  plan: null,
  suggestions: null,
  status: 'idle',
  setPlan: (plan) => {
    persistPlan(plan)
    set({ plan })
  },
  updatePlan: (partial) => {
    const current = get().plan
    if (!current) return
    const next = validateSessionPlan({ ...current, ...partial })
    persistPlan(next)
    set({ plan: next })
  },
  hydrateFromStorage: (mode) => {
    const stored = readStoredPlan()
    if (stored) {
      const plan = mode ? validateSessionPlan({ ...stored, mode }) : stored
      set({ plan, status: 'ready' })
      return
    }
    set({ status: 'idle' })
  },
  loadSuggestions: async (mode) => {
    set({ status: 'loading' })
    try {
      const response = await fetch('/api/tutor/session-plan')
      if (!response.ok) throw new Error('session_plan_unavailable')
      const payload = await response.json() as SessionPlanSuggestions
      const stored = readStoredPlan()
      const plan = stored
        ? validateSessionPlan({ ...stored, mode: mode ?? stored.mode })
        : validateSessionPlan({ ...payload.defaults, mode: mode ?? payload.defaults.mode })
      persistPlan(plan)
      set({ suggestions: payload, plan, status: 'ready' })
    } catch {
      const fallback = buildSessionPlanSuggestions({ mode })
      const plan = validateSessionPlan({ ...fallback.defaults, mode: mode ?? fallback.defaults.mode })
      persistPlan(plan)
      set({ suggestions: fallback, plan, status: 'error' })
    }
  },
  clearPlan: () => {
    persistPlan(null)
    set({ plan: null, suggestions: null, status: 'idle' })
  },
}))

export const selectSessionPlan = (state: SessionPlanStore) => state.plan
export const selectSessionPlanStatus = (state: SessionPlanStore) => state.status
export const selectSessionPlanSuggestions = (state: SessionPlanStore) => state.suggestions
