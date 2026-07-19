'use client'

import FriendlyError from '@/components/ui/FriendlyError'

export default function AccountError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <FriendlyError error={error} reset={reset} title="Could not load your learning space" />
}
