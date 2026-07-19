'use client'

import { useEffect, useRef } from 'react'
import { selectClearPanel, selectPanel, useLearnSessionStore } from '@/stores/useLearnSessionStore'
import { MarkdownWithTts } from '@/components/lesson/MarkdownWithTts'
import ActivityRenderer, { type ActivityCompleteResult } from './ActivityRenderer'
import { Button } from '@/components/ui/button'

interface DynamicContentPanelProps {
  onActivityComplete?: (result: ActivityCompleteResult) => void
  onActivityDifficult?: (activityId: string) => void
}

export default function DynamicContentPanel({ onActivityComplete, onActivityDifficult }: DynamicContentPanelProps) {
  const panel = useLearnSessionStore(selectPanel)
  const clearPanel = useLearnSessionStore(selectClearPanel)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (panel.kind !== 'empty') headingRef.current?.focus({ preventScroll: window.innerWidth >= 1024 })
  }, [panel.kind])

  if (panel.kind === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center p-8">
        <p className="text-(--text-muted) text-sm max-w-sm">
          Your lesson content will appear here — grammar explanations, quizzes, and interactive
          activities guided by the AI tutor.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col" aria-live="polite">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-(--border-primary)">
        <h2 ref={headingRef} tabIndex={-1} className="font-display font-bold text-(--text-primary) text-sm truncate focus:outline-none">
          {panel.kind === 'grammar' && (panel.title ?? 'Lesson')}
          {panel.kind === 'activity' && panel.activity.title}
          {panel.kind === 'question' && 'Quick check'}
        </h2>
        <div className="flex items-center gap-1">
          {panel.kind === 'activity' && onActivityDifficult && (
              <Button variant="ghost" size="sm" onClick={() => onActivityDifficult(panel.activity.id)}>
              Need help
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearPanel}>
            Close
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-6">
        {panel.kind === 'grammar' && (
          <MarkdownWithTts
            content={panel.markdown}
            className="prose prose-sm max-w-none text-(--text-secondary)"
          />
        )}

        {panel.kind === 'activity' && (
          <div>
            {panel.activity.description && (
              <p className="text-sm text-(--text-secondary) mb-4">{panel.activity.description}</p>
            )}
            <ActivityRenderer
              activity={panel.activity}
              onComplete={(result) => onActivityComplete?.({
                ...result,
                chapterId: panel.chapterId,
                moduleId: panel.moduleId,
              })}
            />
          </div>
        )}

        {panel.kind === 'question' && (
          <div className="space-y-4">
            <p className="text-(--text-primary) font-medium">{panel.prompt}</p>
            {panel.options && panel.options.length > 0 && (
              <ul className="space-y-2">
                {panel.options.map((opt, i) => (
                  <li
                    key={opt}
                    className="px-4 py-3 rounded-xl border border-(--border-primary) bg-(--bg-card) text-sm text-(--text-secondary)"
                  >
                    <span className="font-bold text-(--accent) mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
