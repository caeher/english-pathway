'use client'

import DynamicContentPanel from './DynamicContentPanel'
import type { ActivityCompleteResult } from './ActivityRenderer'

interface LearnSessionLayoutProps {
  tutorSlot: React.ReactNode
  onActivityComplete?: (result: ActivityCompleteResult) => void
  onActivityDifficult?: (activityId: string) => void
}

export default function LearnSessionLayout({
  tutorSlot,
  onActivityComplete,
  onActivityDifficult,
}: LearnSessionLayoutProps) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col divide-y divide-(--border-primary) lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      <section className="min-h-[min(440px,58dvh)] max-h-[58dvh] overflow-y-auto bg-(--bg-secondary)/30 pb-[env(safe-area-inset-bottom)] lg:min-h-0 lg:max-h-none lg:pb-0">
        {tutorSlot}
      </section>
      <section className="min-h-[42dvh] flex-1 bg-(--bg-primary) lg:min-h-0">
        <DynamicContentPanel onActivityComplete={onActivityComplete} onActivityDifficult={onActivityDifficult} />
      </section>
    </div>
  )
}
