import * as React from 'react'
import { cn } from '@/lib/helpers'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border-2 border-(--border-primary) bg-(--bg-card) px-4 py-2',
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
Input.displayName = 'Input'

export { Input }
