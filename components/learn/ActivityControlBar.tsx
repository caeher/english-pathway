'use client'

import { useState } from 'react'
import { CircleHelp, RotateCcw, SkipForward, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActivityControlBarProps {
  activityTitle: string
  activityType: string
  onHelp?: () => void
  onReset: () => void
  onExit: () => void
}

export function ActivityControlBar({ activityTitle, activityType, onHelp, onReset, onExit }: ActivityControlBarProps) {
  const [showInstructions, setShowInstructions] = useState(false)
  const confirmReset = () => {
    if (window.confirm('Restart this activity? Your answers in the current attempt will be cleared.')) onReset()
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
        <Button variant="ghost" size="sm" type="button" onClick={confirmExit}><SkipForward className="h-4 w-4" /> Skip</Button>
        <Button variant="ghost" size="sm" type="button" className="ml-auto" onClick={confirmExit}><X className="h-4 w-4" /> Exit</Button>
      </div>
      {showInstructions && <p id="activity-instructions" className="mt-2 text-sm text-(--text-secondary)">Complete the {activityType} activity at your pace. Use its labelled controls and keyboard shortcuts; restart clears only this attempt, while Skip and Exit keep the activity available to resume later.</p>}
    </section>
  )
}
