'use client'

import { useEffect, useRef } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { getActivityResumeCopy } from '@/lib/learn/activity-language-policy'

export const DEFAULT_RESUME_COPY = {
  title: 'Continue where you left off?',
  resume: 'Resume',
  startOver: 'Start over',
  ariaLabel: 'Saved progress found. Choose Resume or Start over.',
} as const

interface ActivityResumePromptProps {
  summary: string
  learnerLevel?: string | null
  nativeLanguage?: string | null
  onResume: () => void
  onStartOver: () => void
}

export default function ActivityResumePrompt({ summary, learnerLevel, nativeLanguage, onResume, onStartOver }: ActivityResumePromptProps) {
  const resumeRef = useRef<HTMLButtonElement>(null)
  const copy = getActivityResumeCopy(learnerLevel, nativeLanguage) ?? DEFAULT_RESUME_COPY

  useEffect(() => {
    resumeRef.current?.focus()
  }, [])

  return (
    <section
      role="region"
      aria-labelledby="activity-resume-title"
      className="mb-5 rounded-2xl border border-(--border-primary) bg-(--bg-card) p-5 shadow-sm"
    >
      <h2 id="activity-resume-title" className="font-display text-lg font-bold text-(--text-primary)">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm text-(--text-secondary)">{summary}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button ref={resumeRef} onClick={onResume} size="md" className="gap-2">
          <Play className="h-4 w-4" /> {copy.resume}
        </Button>
        <Button onClick={onStartOver} variant="outline" size="md" className="gap-2">
          <RotateCcw className="h-4 w-4" /> {copy.startOver}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {copy.ariaLabel} {summary}.
      </p>
    </section>
  )
}
