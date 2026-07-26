'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import LearnHelpDialog from '@/components/learn/LearnHelpDialog'

export interface LearnSessionHeaderProps {
  exitHref?: string
}

export default function LearnSessionHeader({ exitHref = '/dashboard' }: LearnSessionHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 shrink-0 border-b border-(--border-primary) bg-(--bg-primary)/95 backdrop-blur supports-[backdrop-filter]:bg-(--bg-primary)/85"
      style={{ ['--learn-session-header-height' as string]: '2.75rem' }}
      aria-label="Current learning session"
    >
      <div className="flex w-full items-center justify-between px-4 py-2 sm:px-6">
        <Link
          href={exitHref}
          aria-label="Back to dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-(--text-secondary) no-underline transition-colors hover:bg-(--bg-tertiary) hover:text-(--accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Back to dashboard</span>
          <span aria-hidden="true">Dashboard</span>
        </Link>
        <LearnHelpDialog />
      </div>
    </header>
  )
}
