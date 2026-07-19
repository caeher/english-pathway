'use client'

import FriendlyError from '@/components/ui/FriendlyError'

export default function LearnError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <FriendlyError error={error} reset={reset} title="Could not prepare your lesson" />
}
