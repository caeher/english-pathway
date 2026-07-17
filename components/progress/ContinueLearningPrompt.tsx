'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen } from 'lucide-react'

interface LastProgress {
  activityTitle: string | null
  chapterTitle: string | null
  moduleTitle: string | null
  curriculumUrl: string | null
}

export default function ContinueLearningPrompt() {
  const [progress, setProgress] = useState<LastProgress | null>(null)

  useEffect(() => {
    fetch('/api/progress/last-activity')
      .then(async (response) => {
        if (!response.ok) return null
        const data = await response.json() as { progress: LastProgress | null }
        return data.progress
      })
      .then(setProgress)
      .catch(() => {})
  }, [])

  if (!progress?.curriculumUrl) return null

  return (
    <aside className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6" aria-label="Continue learning">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-card) px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <BookOpen className="h-5 w-5 shrink-0 text-(--accent)" />
          <p className="truncate text-sm text-(--text-secondary)">
            Continue <span className="font-bold text-(--text-primary)">{progress.activityTitle ?? progress.chapterTitle}</span>
            {progress.moduleTitle ? ` in ${progress.moduleTitle}` : ''}
          </p>
        </div>
        <Link href={progress.curriculumUrl} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-(--accent) no-underline hover:underline">
          Resume <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  )
}
