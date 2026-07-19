import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/helpers'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-display font-bold tracking-wide',
  {
    variants: {
      variant: {
        neutral: 'bg-(--bg-tertiary) text-(--text-secondary)',
        accent: 'bg-(--accent-soft) text-(--accent)',
        secondary: 'bg-(--secondary-soft) text-(--secondary)',
        reward: 'bg-(--reward-soft) text-(--reward)',
        success: 'bg-(--success-soft) text-(--success)',
        destructive: 'bg-red-500/10 text-red-600 dark:text-red-400',
      },
      size: { sm: 'px-2 py-0.5 text-[10px]', md: 'px-2.5 py-1 text-xs' },
    },
    defaultVariants: { variant: 'neutral', size: 'sm' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props} />
  ),
)
Badge.displayName = 'Badge'

export { badgeVariants }
