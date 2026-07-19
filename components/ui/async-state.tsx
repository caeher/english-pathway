import * as React from 'react'
import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { Button } from './button'
import { FeedbackCard } from './feedback-card'
import { Surface } from './surface'

interface LoadingStateProps {
  title?: string
  description?: string
  className?: string
  lines?: number
}

export function LoadingState({ title = 'Loading', description, className, lines = 3 }: LoadingStateProps) {
  return (
    <section className={cn('mx-auto w-full max-w-3xl space-y-4 py-10', className)} aria-busy="true" aria-live="polite" aria-label={title}>
      <div className="flex items-center gap-3 text-sm font-bold text-(--text-secondary)">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-(--accent) border-t-transparent" aria-hidden="true" />
        <span>{title}</span>
      </div>
      {description && <p className="text-sm text-(--text-muted)">{description}</p>}
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => <div key={index} className={cn('h-4 animate-pulse rounded bg-(--bg-tertiary)', index === lines - 1 ? 'w-2/3' : 'w-full')} />)}
      </div>
    </section>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <Surface as="section" padding="lg" className={cn('mx-auto flex min-h-64 max-w-lg flex-col items-center justify-center text-center', className)} role="status">
      <div className="flex h-12 w-12 items-center justify-center rounded-(--radius-control) bg-(--success-soft) text-(--success)" aria-hidden="true">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h2 className="mt-4 font-display text-xl font-black text-(--text-primary)">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-(--text-secondary)">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Surface>
  )
}

interface InlineErrorProps {
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function InlineError({ message, onRetry, retryLabel = 'Try again', className }: InlineErrorProps) {
  return (
    <FeedbackCard variant="error" className={className} title="Something went wrong" role="alert" aria-live="assertive">
      <div className="flex flex-wrap items-center gap-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
        <span className="flex-1">{message}</span>
        {onRetry && <Button type="button" size="sm" variant="outline" onClick={onRetry}>{retryLabel}</Button>}
      </div>
    </FeedbackCard>
  )
}

interface SuccessStateProps {
  title: string
  description?: string
  className?: string
}

export function SuccessState({ title, description, className }: SuccessStateProps) {
  return (
    <FeedbackCard variant="success" className={className} title={title}>
      <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-(--success)" aria-hidden="true" />{description}</span>
    </FeedbackCard>
  )
}
