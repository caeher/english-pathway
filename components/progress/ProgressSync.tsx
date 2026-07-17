'use client'

import { useEffect } from 'react'
import { mergeGuestProgress } from '@/lib/progress/client'

export default function ProgressSync() {
  useEffect(() => {
    void mergeGuestProgress()
  }, [])

  return null
}
