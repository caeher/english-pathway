'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveChapterProgress } from '@/lib/progress/client'

interface CompleteChapterButtonProps {
  chapterId: string
  initialCompleted: boolean
  canComplete: boolean
}

export function CompleteChapterButton({ chapterId, initialCompleted, canComplete }: CompleteChapterButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function markCompleted() {
    if (completed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const saved = await saveChapterProgress({ chapterId, status: 'completed' })
      if (!saved) throw new Error('Unable to save your chapter completion.')
      setCompleted(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save your chapter completion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Button onClick={markCompleted} disabled={completed || submitting || !canComplete} variant={completed ? 'reward' : 'accent'}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {completed ? 'Completed' : canComplete ? 'Complete chapter' : 'Complete activities first'}
      </Button>
      {!completed && !canComplete && <p className="mt-2 text-sm text-(--text-secondary)">Finish every activity in this chapter before marking it complete.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
