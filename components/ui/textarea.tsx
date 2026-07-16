import * as React from 'react'
import { cn } from '@/lib/helpers'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[88px] w-full resize-y rounded-xl border-2 border-(--border-primary) bg-(--bg-card) px-4 py-3',
        'font-display text-sm text-(--text-primary) placeholder:text-(--text-muted)',
        'focus:outline-none focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }
