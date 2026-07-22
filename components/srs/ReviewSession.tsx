'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button, EmptyState, InlineError, LoadingState } from '@/components/ui'
import { trackEvent } from '@/lib/analytics/events'
import type { SrsQueueItem } from '@/lib/srs/types'

const grades = [
  { label: 'Again', quality: 1, variant: 'destructive' as const },
  { label: 'Hard', quality: 3, variant: 'outline' as const },
  { label: 'Good', quality: 4, variant: 'secondary' as const },
  { label: 'Easy', quality: 5, variant: 'reward' as const },
]

export default function ReviewSession() {
  const [items, setItems] = useState<SrsQueueItem[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/srs/queue')
      if (!response.ok) throw new Error('Unable to load your review queue.')
      const data = await response.json() as { items: SrsQueueItem[] }
      setIndex(0)
      setRevealed(false)
      setItems(data.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your review queue.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadQueue() }, [loadQueue])

  const item = items[index]

  async function submitGrade(quality: number) {
    if (!item || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/srs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review', itemId: item.id, quality }),
      })
      if (!response.ok) throw new Error('Unable to save this review.')
      trackEvent('srs_review_complete', { quality, activity_id: item.content.activityId })
      window.dispatchEvent(new Event('srs-queue-updated'))
      setRevealed(false)
      if (index + 1 >= items.length) void loadQueue()
      else setIndex((current) => current + 1)
    } catch (gradeError) {
      setError(gradeError instanceof Error ? gradeError.message : 'Unable to save this review.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingState title="Loading your review queue" description="Preparing the items that are due today." className="mx-auto max-w-6xl px-6 py-12" />
  }

  if (error && !item) {
    return <InlineError message={error} onRetry={() => void loadQueue()} className="mx-auto mt-12 max-w-6xl px-6" />
  }

  if (!item) {
    return <EmptyState className="mx-auto mt-12 max-w-6xl px-6" icon={<Check className="h-6 w-6" />} title="All caught up" description="There are no review items due right now. Keep learning and return when you are ready." action={<Link href="/learn" className="font-bold text-(--accent) no-underline hover:underline">Return to Learn</Link>} />
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-center justify-between text-sm text-(--text-muted)">
        <span className="font-display font-bold">Review {index + 1} of {items.length}</span>
        <span>{item.content.chapterTitle}</span>
      </div>

      <article className="rounded-3xl border border-(--border-primary) bg-(--bg-card) p-6 shadow-sm sm:p-9">
        <p className="text-xs font-display font-bold uppercase tracking-wide text-(--accent)">Recall</p>
        <h1 className="mt-3 text-2xl font-display font-black text-(--text-primary) sm:text-3xl">{item.content.prompt}</h1>
        {item.content.hint && <p className="mt-4 text-sm text-(--text-muted)">{item.content.hint}</p>}

        {!revealed ? (
          <Button className="mt-8" onClick={() => setRevealed(true)}>
            Show answer <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="mt-8 border-t border-(--border-primary) pt-6">
            <p className="text-xs font-display font-bold uppercase tracking-wide text-(--secondary)">Answer</p>
            <p className="mt-2 text-xl font-display font-bold text-(--text-primary)">{item.content.answer}</p>
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {grades.map((grade) => (
                <Button key={grade.label} variant={grade.variant} size="sm" disabled={submitting} onClick={() => submitGrade(grade.quality)}>
                  {grade.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </article>

      {error && <InlineError message={error} onRetry={() => { setError(null); setRevealed(true) }} className="mt-4" />}
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-(--text-muted)">
        <Sparkles className="h-3.5 w-3.5" /> Your next review adapts to this answer.
      </p>
    </section>
  )
}
