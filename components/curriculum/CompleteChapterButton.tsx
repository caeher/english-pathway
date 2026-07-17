'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveChapterProgress } from '@/lib/progress/client'

interface CompleteChapterButtonProps {
  chapterId: string
  initialCompleted: boolean
}

export function CompleteChapterButton({ chapterId, initialCompleted }: CompleteChapterButtonProps) {
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
      <Button onClick={markCompleted} disabled={completed || submitting} variant={completed ? 'reward' : 'accent'}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {completed ? 'Completed' : 'Mark as completed'}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
