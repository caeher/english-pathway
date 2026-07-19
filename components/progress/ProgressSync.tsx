'use client'

import { useEffect } from 'react'
import { mergeGuestProgress } from '@/features/progress'

export default function ProgressSync() {
  useEffect(() => {
    void mergeGuestProgress()
  }, [])

  return null
}
