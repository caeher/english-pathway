'use client'

import { useState } from 'react'
import { ListChecks } from 'lucide-react'
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui'
import { trackEvent } from '@/lib/analytics/events'
import {
  SESSION_PLAN_GOAL_LABELS,
  SESSION_PLAN_SKILL_LABELS,
  buildSessionPlanUpdateMessage,
  type SessionPlan,
  type SessionPlanDuration,
  type SessionPlanGoal,
  type SessionPlanSkill,
} from '@/lib/learn/session-plan'
import { selectSessionPlan, useSessionPlanStore } from '@/stores/useSessionPlanStore'

const GOAL_OPTIONS: SessionPlanGoal[] = ['continue', 'review', 'practice', 'conversation']
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

interface SessionPlanSheetProps {
  onPlanUpdated?: (plan: SessionPlan) => void
}

export default function SessionPlanSheet({ onPlanUpdated }: SessionPlanSheetProps) {
  const plan = useSessionPlanStore(selectSessionPlan)
  const updatePlan = useSessionPlanStore((state) => state.updatePlan)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<SessionPlan | null>(plan)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraft(plan)
    setOpen(nextOpen)
  }

  const handleSave = () => {
    if (!draft || !plan) return
    const changedField = draft.goal !== plan.goal
      ? 'goal'
      : draft.skill !== plan.skill
        ? 'skill'
        : draft.durationMinutes !== plan.durationMinutes
          ? 'duration'
          : 'goal'
    updatePlan(draft)
    trackEvent('session_plan_change', {
      field_changed: changedField,
      goal: draft.goal,
      skill: draft.skill,
      duration_minutes: draft.durationMinutes,
    })
    onPlanUpdated?.(draft)
    setOpen(false)
  }

  if (!plan || !draft) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
          Session plan
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby="session-plan-sheet-description">
        <SheetHeader className="border-b border-(--border-primary) p-4">
          <SheetTitle>Adjust your session plan</SheetTitle>
          <SheetDescription id="session-plan-sheet-description">
            Update your goal or duration without ending the session.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wide text-(--text-muted)">Goal</legend>
            <div className="mt-2 grid gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  aria-pressed={draft.goal === goal}
                  onClick={() => setDraft({ ...draft, goal, skill: goal === 'conversation' ? 'speaking' : draft.skill })}
                  className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${draft.goal === goal ? 'border-(--accent) bg-(--accent-soft)' : 'border-(--border-primary)'}`}
                >
                  {SESSION_PLAN_GOAL_LABELS[goal]}
                </button>
              ))}
            </div>
          </fieldset>

          {draft.goal === 'practice' && (
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-wide text-(--text-muted)">Skill</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    aria-pressed={draft.skill === skill}
                    onClick={() => setDraft({ ...draft, skill })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${draft.skill === skill ? 'border-(--accent) bg-(--accent-soft) text-(--accent)' : 'border-(--border-primary) text-(--text-secondary)'}`}
                  >
                    {SESSION_PLAN_SKILL_LABELS[skill]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wide text-(--text-muted)">Duration</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  aria-pressed={draft.durationMinutes === duration}
                  onClick={() => setDraft({ ...draft, durationMinutes: duration })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${draft.durationMinutes === duration ? 'border-(--accent) bg-(--accent-soft) text-(--accent)' : 'border-(--border-primary) text-(--text-secondary)'}`}
                >
                  {duration} min
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="border-t border-(--border-primary) p-4">
          <Button type="button" className="w-full" onClick={handleSave}>
            Save plan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { buildSessionPlanUpdateMessage }
