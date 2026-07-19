import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/helpers'

const feedbackCardVariants = cva('rounded-(--radius-card) border p-4', {
  variants: {
    variant: {
      info: 'border-(--accent)/30 bg-(--accent-soft)',
      success: 'border-(--success)/30 bg-(--success-soft)',
      warning: 'border-(--reward)/30 bg-(--reward-soft)',
      error: 'border-red-500/30 bg-red-500/10',
    },
  },
  defaultVariants: { variant: 'info' },
})

interface FeedbackCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof feedbackCardVariants> {
  title?: string
}

export function FeedbackCard({ title, variant, className, children, ...props }: FeedbackCardProps) {
  return (
    <div className={cn(feedbackCardVariants({ variant, className }))} role="status" {...props}>
      {title && <p className="font-bold text-(--text-primary)">{title}</p>}
      <div className={cn(title && 'mt-1', 'text-sm text-(--text-secondary)')}>{children}</div>
    </div>
  )
}
