'use client'

import { useState } from 'react'
import { CircleHelp, RotateCcw, SkipForward, X } from 'lucide-react'
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
    <section className="sticky top-0 z-10 -mx-4 mb-4 border-y border-(--border-primary) bg-(--bg-primary)/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6" aria-label={`${activityTitle} controls`}>
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" type="button" onClick={() => setShowInstructions((visible) => !visible)} aria-expanded={showInstructions} aria-controls="activity-instructions"><CircleHelp className="h-4 w-4" /> Instructions</Button>
        {onHelp && <Button variant="ghost" size="sm" type="button" onClick={onHelp}>Need help</Button>}
        <Button variant="ghost" size="sm" type="button" onClick={confirmReset}><RotateCcw className="h-4 w-4" /> Restart</Button>
        <Button variant="ghost" size="sm" type="button" onClick={confirmSkip}><SkipForward className="h-4 w-4" /> Skip</Button>
        <Button variant="ghost" size="sm" type="button" className="ml-auto" onClick={confirmExit}><X className="h-4 w-4" /> Exit</Button>
      </div>
      {showInstructions && (
        <p id="activity-instructions" className="mt-2 text-sm text-(--text-secondary)">
          {buildInstructionText(activityType, accessibilityCapabilities, learnerLevel, nativeLanguage)}
        </p>
      )}
    </section>
  )
}
