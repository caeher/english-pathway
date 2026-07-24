'use client'

import { Lightbulb } from 'lucide-react'
import type { GraduatedHintLevel, ResolvedHint } from '@/features/activities'
import { getHintLabel } from '@/features/activities/hints'
import { Button } from '@/components/ui/button'

interface ActivityHintTrayProps {
  hint: ResolvedHint
  maxLevel: GraduatedHintLevel
  onMoreHelp?: () => void
  moreHelpDisabled?: boolean
}

export function ActivityHintTray({
  hint,
  maxLevel,
  onMoreHelp,
  moreHelpDisabled = false,
}: ActivityHintTrayProps) {
  return (
    <section
      className="mb-4 rounded-xl border border-(--accent)/30 bg-(--accent-soft)/40 px-4 py-3"
      aria-label="Activity hint"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-(--accent)">
        <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{`${getHintLabel(hint.level)} (${hint.level}/${maxLevel})`}</span>
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
            More help
          </Button>
        </div>
      )}
    </section>
  )
}
