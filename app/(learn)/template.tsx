'use client'

import PageTransition from '@/components/transitions/PageTransition'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PageTransition>{children}</PageTransition>
    </div>
  )
}
