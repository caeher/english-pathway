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
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-(--border-primary)">
      <section className="min-h-[360px] lg:min-h-0 bg-(--bg-secondary)/30">
        {tutorSlot}
      </section>
      <section className="min-h-[400px] lg:min-h-0 bg-(--bg-primary)">
        <DynamicContentPanel onActivityComplete={onActivityComplete} onActivityDifficult={onActivityDifficult} />
      </section>
    </div>
  )
}
