'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, RotateCcw } from 'lucide-react'
import { useContinuation } from '@/lib/learn/use-continuation'

export default function ContinueLearningPrompt() {
  const continuation = useContinuation()

  if (!continuation) return null

  return (
    <aside className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6" aria-label="Continue learning">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-card) px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          {continuation.kind === 'review' ? <RotateCcw className="h-5 w-5 shrink-0 text-(--accent)" /> : <BookOpen className="h-5 w-5 shrink-0 text-(--accent)" />}
          <p className="truncate text-sm text-(--text-secondary)">
            <span className="font-bold text-(--text-primary)">{continuation.title}</span> — {continuation.description}
          </p>
        </div>
        <Link href={continuation.href} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-(--accent) no-underline hover:underline">
          {continuation.label} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  )
}
