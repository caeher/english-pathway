'use client'

import { useEffect, useRef } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActivityResumePromptProps {
  summary: string
  onResume: () => void
  onStartOver: () => void
}

export default function ActivityResumePrompt({ summary, onResume, onStartOver }: ActivityResumePromptProps) {
  const resumeRef = useRef<HTMLButtonElement>(null)

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
        Continue where you left off?
      </h2>
      <p className="mt-2 text-sm text-(--text-secondary)">{summary}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button ref={resumeRef} onClick={onResume} size="md" className="gap-2">
          <Play className="h-4 w-4" /> Resume
        </Button>
        <Button onClick={onStartOver} variant="outline" size="md" className="gap-2">
          <RotateCcw className="h-4 w-4" /> Start over
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        Saved progress found. {summary}. Choose Resume or Start over.
      </p>
    </section>
  )
}
