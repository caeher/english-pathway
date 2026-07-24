'use client'

import { useEffect } from 'react'
import { BookOpen, Clock, MessageCircle, RotateCcw, Target } from 'lucide-react'
import { Surface } from '@/components/ui'
import { trackEvent } from '@/lib/analytics/events'
import {
  SESSION_PLAN_GOAL_LABELS,
  SESSION_PLAN_SKILL_LABELS,
  type SessionPlan,
  type SessionPlanDuration,
  type SessionPlanGoal,
  type SessionPlanSkill,
} from '@/lib/learn/session-plan'
import {
  selectSessionPlan,
  selectSessionPlanStatus,
  selectSessionPlanSuggestions,
  useSessionPlanStore,
} from '@/stores/useSessionPlanStore'

const GOAL_OPTIONS: Array<{ value: SessionPlanGoal; icon: typeof Target }> = [
  { value: 'continue', icon: BookOpen },
  { value: 'review', icon: RotateCcw },
  { value: 'practice', icon: Target },
  { value: 'conversation', icon: MessageCircle },
]

const SKILL_OPTIONS: SessionPlanSkill[] = [
  'grammar',
  'vocabulary',
  'listening',
  'speaking',
  'reading',
  'pronunciation',
  'mixed',
]

const DURATION_OPTIONS: SessionPlanDuration[] = [5, 10, 15, 20]

interface SessionPlanPreflightProps {
  mode: SessionPlan['mode']
  disabled?: boolean
}

export default function SessionPlanPreflight({ mode, disabled = false }: SessionPlanPreflightProps) {
  const plan = useSessionPlanStore(selectSessionPlan)
  const status = useSessionPlanStore(selectSessionPlanStatus)
  const suggestions = useSessionPlanStore(selectSessionPlanSuggestions)
  const loadSuggestions = useSessionPlanStore((state) => state.loadSuggestions)
  const setPlan = useSessionPlanStore((state) => state.setPlan)
  const updatePlan = useSessionPlanStore((state) => state.updatePlan)

  useEffect(() => {
    void loadSuggestions(mode)
  }, [loadSuggestions, mode])

  useEffect(() => {
    if (plan && plan.mode !== mode) {
      updatePlan({ mode })
    }
  }, [mode, plan, updatePlan])

  const handleGoalChange = (goal: SessionPlanGoal) => {
    if (!plan) return
    const next = {
      ...plan,
      goal,
      skill: goal === 'conversation' ? 'speaking' as const : plan.skill,
    }
    setPlan(next)
    trackEvent('session_plan_select', {
      goal,
      skill: next.skill,
      duration_minutes: next.durationMinutes,
      has_suggestion: Boolean(next.suggestedStep),
    })
  }

  const handleSkillChange = (skill: SessionPlanSkill) => {
    if (!plan) return
    updatePlan({ skill })
    trackEvent('session_plan_change', {
      field_changed: 'skill',
      goal: plan.goal,
      skill,
      duration_minutes: plan.durationMinutes,
    })
  }

  const handleDurationChange = (durationMinutes: SessionPlanDuration) => {
    if (!plan) return
    updatePlan({ durationMinutes })
    trackEvent('session_plan_change', {
      field_changed: 'duration',
      goal: plan.goal,
      skill: plan.skill,
      duration_minutes: durationMinutes,
    })
  }

  if (status === 'loading' || !plan) {
    return (
      <Surface as="section" padding="md" className="sm:p-5" aria-busy="true" aria-label="Loading session plan">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-(--bg-tertiary)" />
          <div className="h-6 w-48 rounded bg-(--bg-tertiary)" />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="h-16 rounded-xl bg-(--bg-tertiary)" />
            <div className="h-16 rounded-xl bg-(--bg-tertiary)" />
          </div>
        </div>
      </Surface>
    )
  }

  return (
    <Surface as="section" padding="md" className="sm:p-5" aria-labelledby="session-plan-heading">
      <p className="text-xs font-bold uppercase tracking-wide text-(--accent)">Session plan</p>
      <h2 id="session-plan-heading" className="mt-1 font-display text-xl font-black text-(--text-primary)">
        What do you want to work on?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">
        Choose a goal and duration. Your tutor will follow this plan for the session.
      </p>

      {suggestions?.continuationHint && (
        <div className="mt-4 rounded-xl border border-(--border-primary) bg-(--bg-secondary)/50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-(--text-muted)">Suggested</p>
          <p className="mt-1 text-sm font-semibold text-(--text-primary)">{suggestions.continuationHint.title}</p>
          <p className="mt-0.5 text-xs text-(--text-secondary)">{suggestions.continuationHint.description}</p>
        </div>
      )}

      {status === 'error' && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-200" role="status">
          We could not load personalized suggestions. You can still start with the defaults below.
        </p>
      )}

      <fieldset className="mt-4 grid gap-2 sm:grid-cols-2" disabled={disabled}>
        <legend className="sr-only">Session goal</legend>
        {GOAL_OPTIONS.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={plan.goal === value}
            onClick={() => handleGoalChange(value)}
            className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${plan.goal === value ? 'border-(--accent) bg-(--accent-soft)' : 'border-(--border-primary) bg-(--bg-primary)'}`}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-(--text-primary)">
              <Icon className="h-4 w-4 text-(--accent)" aria-hidden="true" />
              {SESSION_PLAN_GOAL_LABELS[value]}
            </span>
          </button>
        ))}
      </fieldset>

      {plan.goal === 'practice' && (
        <fieldset className="mt-4" disabled={disabled}>
          <legend className="text-xs font-bold uppercase tracking-wide text-(--text-muted)">Skill focus</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((skill) => (
              <button
                key={skill}
                type="button"
                aria-pressed={plan.skill === skill}
                onClick={() => handleSkillChange(skill)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${plan.skill === skill ? 'border-(--accent) bg-(--accent-soft) text-(--accent)' : 'border-(--border-primary) text-(--text-secondary)'}`}
              >
                {SESSION_PLAN_SKILL_LABELS[skill]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="mt-4" disabled={disabled}>
        <legend className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-(--text-muted)">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Duration
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((duration) => (
            <button
              key={duration}
              type="button"
              aria-pressed={plan.durationMinutes === duration}
              onClick={() => handleDurationChange(duration)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${plan.durationMinutes === duration ? 'border-(--accent) bg-(--accent-soft) text-(--accent)' : 'border-(--border-primary) text-(--text-secondary)'}`}
            >
              {duration} min
            </button>
          ))}
        </div>
      </fieldset>
    </Surface>
  )
}
