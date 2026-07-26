'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/helpers'

interface ChatConversationShellProps {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
  className?: string
}

export function ChatConversationShell({
  header,
  footer,
  children,
  className,
}: ChatConversationShellProps) {
  return (
    <section
      className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}
      aria-label="Conversation"
    >
      {header}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
      <footer className="sticky bottom-0 shrink-0 border-t border-(--border-primary) bg-(--bg-primary)/95 backdrop-blur supports-[backdrop-filter]:bg-(--bg-primary)/85 pb-[env(safe-area-inset-bottom)]">
        {footer}
      </footer>
    </section>
  )
}
