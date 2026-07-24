'use client'

import { useEffect, useState } from 'react'
import type { ContinuationInfo } from '@/lib/learn/session-ui-state'

interface ContinuationResponse {
  continuation: ContinuationInfo
}

export function useContinuation() {
  const [continuation, setContinuation] = useState<ContinuationInfo | null>(null)

  useEffect(() => {
    fetch('/api/progress/continuation')
      .then(async (response) => {
        if (!response.ok) return null
        const data = await response.json() as ContinuationResponse
        return data.continuation
      })
      .then(setContinuation)
      .catch(() => {})
  }, [])

  return continuation
}
