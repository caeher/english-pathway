import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/helpers'

const surfaceVariants = cva(
  'rounded-(--radius-card) border border-(--border-primary) text-(--text-primary)',
  {
    variants: {
      variant: {
        card: 'bg-(--bg-card)',
        muted: 'bg-(--bg-secondary)/50',
        subtle: 'bg-(--bg-tertiary)/50',
        accent: 'border-(--accent)/30 bg-(--accent-soft)',
        success: 'border-(--success)/30 bg-(--success-soft)',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
      },
      elevation: {
        flat: '',
        raised: 'shadow-(--shadow-sm)',
        floating: 'shadow-(--shadow-lg)',
      },
    },
    defaultVariants: { variant: 'card', padding: 'md', elevation: 'flat' },
  },
)

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof surfaceVariants> {
  as?: 'div' | 'section' | 'article' | 'aside'
}

export function Surface({ as: Component = 'div', className, variant, padding, elevation, ...props }: SurfaceProps) {
  return <Component className={cn(surfaceVariants({ variant, padding, elevation, className }))} {...props} />
}

export { surfaceVariants }
