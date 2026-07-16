'use client'

import FriendlyError from '@/components/ui/FriendlyError'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <FriendlyError error={error} reset={reset} title="Authentication error" />
}
