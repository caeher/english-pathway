'use client'

import { Lightbulb } from 'lucide-react'
import type { GraduatedHintLevel, ResolvedHint } from '@/features/activities'
import { getHintLabel } from '@/features/activities/hints'
import { Button } from '@/components/ui/button'

import { shouldApplyNativeActivityUi } from '@/lib/learn/activity-language-policy'

interface ActivityHintTrayProps {
  hint: ResolvedHint
  maxLevel: GraduatedHintLevel
  learnerLevel?: string | null
  nativeLanguage?: string | null
  onMoreHelp?: () => void
  moreHelpDisabled?: boolean
}

export function ActivityHintTray({
  hint,
  maxLevel,
  learnerLevel,
  nativeLanguage,
  onMoreHelp,
  moreHelpDisabled = false,
}: ActivityHintTrayProps) {
  const isSpanish = shouldApplyNativeActivityUi(learnerLevel, nativeLanguage)

  return (
    <section
      className="mb-4 rounded-xl border border-(--accent)/30 bg-(--accent-soft)/40 px-4 py-3"
      aria-label={isSpanish ? 'Pista de la actividad' : 'Activity hint'}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-(--accent)">
        <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{`${getHintLabel(hint.level, learnerLevel, nativeLanguage)} (${hint.level}/${maxLevel})`}</span>
      </div>
      <p className="mt-2 text-sm text-(--text-primary)">{hint.body}</p>
      {onMoreHelp && hint.level < maxLevel && (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoreHelp}
            disabled={moreHelpDisabled}
          >
            {isSpanish ? 'Más ayuda' : 'More help'}
          </Button>
        </div>
      )}
    </section>
  )
}
