'use client'

import { useState } from 'react'
import { CircleHelp, Lightbulb, RotateCcw, SkipForward, X } from 'lucide-react'
import type { ActivityCapability } from '@/features/activities'
import { Button } from '@/components/ui/button'

import { buildActivityInstructionText } from '@/lib/learn/activity-language-policy'

interface ActivityControlBarProps {
  activityTitle: string
  activityType: string
  accessibilityCapabilities?: readonly ActivityCapability[]
  learnerLevel?: string | null
  nativeLanguage?: string | null
  onHelp?: () => void
  onReset: () => void
  onSkip?: () => void
  onExit: () => void
}

export function buildInstructionText(
  activityType: string,
  accessibilityCapabilities: readonly ActivityCapability[],
  learnerLevel?: string | null,
  nativeLanguage?: string | null,
): string {
  return buildActivityInstructionText(activityType, accessibilityCapabilities, learnerLevel, nativeLanguage)
}

export function ActivityControlBar({
  activityTitle,
  activityType,
  accessibilityCapabilities = ['keyboard'],
  learnerLevel,
  nativeLanguage,
  onHelp,
  onReset,
  onSkip,
  onExit,
}: ActivityControlBarProps) {
  const [showInstructions, setShowInstructions] = useState(false)
  const confirmReset = () => {
    if (window.confirm('Restart this activity? Your answers in the current attempt will be cleared.')) onReset()
  }
  const confirmSkip = () => {
    if (window.confirm('Skip this activity for now? You can try a different practice or return to this later.')) {
      if (onSkip) onSkip()
      else onExit()
    }
  }
  const confirmExit = () => {
    if (window.confirm('Leave this activity? Your current attempt will stay unfinished, but you can resume it from Learn.')) onExit()
  }

  return (
    <section
      className="sticky top-0 z-10 -mx-4 mb-4 border-y border-(--border-primary) bg-(--bg-primary)/95 px-3 py-1.5 backdrop-blur sm:-mx-6 sm:px-6 sm:py-2"
      aria-label={`${activityTitle} controls`}
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setShowInstructions((visible) => !visible)}
            aria-expanded={showInstructions}
            aria-controls="activity-instructions"
            aria-label="Instructions"
            title="Instructions"
            className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-0 px-2 sm:px-3"
          >
            <CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Instructions</span>
          </Button>

          {onHelp && <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onHelp}
            aria-label="Need help"
            title="Need help"
            className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-0 px-2 sm:px-3"
          >
            <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Need help</span>
          </Button>}

          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={confirmReset}
            aria-label="Restart activity"
            title="Restart"
            className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-0 px-2 sm:px-3"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Restart</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={confirmSkip}
            aria-label="Skip activity"
            title="Skip"
            className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-0 px-2 sm:px-3"
          >
            <SkipForward className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Skip</span>
          </Button>
        </div>

        <div className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={confirmExit}
            aria-label="Exit activity"
            title="Exit"
            className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-0 px-2 sm:px-3"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </div>
      {showInstructions && (
        <p id="activity-instructions" className="mt-2 text-sm text-(--text-secondary)">
          {buildInstructionText(activityType, accessibilityCapabilities, learnerLevel, nativeLanguage)}
        </p>
      )}
    </section>
  )
}
