import * as React from 'react'
import { cn } from '@/lib/helpers'

interface SectionHeaderProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function SectionHeader({ eyebrow, title, description, action, className, ...props }: SectionHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)} {...props}>
      <div>
        {eyebrow && <p className="text-sm font-bold uppercase tracking-wide text-(--accent)">{eyebrow}</p>}
        <h2 className={cn('font-display font-black text-(--text-primary)', eyebrow ? 'mt-1 text-2xl' : 'text-xl')}>
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-(--text-secondary)">{description}</p>}
      </div>
      {action}
    </header>
  )
}
