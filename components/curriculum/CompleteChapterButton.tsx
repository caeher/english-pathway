'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button, InlineError } from '@/components/ui'
import { saveChapterProgress } from '@/features/progress/client'

interface CompleteChapterButtonProps {
  chapterId: string
  initialCompleted: boolean
  canComplete: boolean
}

export function CompleteChapterButton({ chapterId, initialCompleted, canComplete }: CompleteChapterButtonProps) {
  const router = useRouter()
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
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save your chapter completion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Button onClick={markCompleted} loading={submitting} loadingLabel="Completing..." disabled={completed || !canComplete} variant={completed ? 'reward' : 'accent'}>
        {!submitting && <Check className="h-4 w-4" />}
        {completed ? 'Completed' : canComplete ? 'Complete chapter' : 'Complete activities first'}
      </Button>
      {!completed && !canComplete && <p className="mt-2 text-sm text-(--text-secondary)">Finish every activity in this chapter before marking it complete.</p>}
      {error && <InlineError message={error} onRetry={() => void markCompleted()} className="mt-3" />}
    </div>
  )
}
