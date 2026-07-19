'use client'

import FriendlyError from '@/components/ui/FriendlyError'

export default function CurriculumError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <FriendlyError error={error} reset={reset} title="Could not load the curriculum" />
}
