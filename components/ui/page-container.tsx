import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/helpers'

/**
 * Standard outer page width for user-facing routes.
 *
 * Use `PageContainer` (or `PAGE_CONTAINER_CLASS`) as the single outer content
 * wrapper on every route except `/learn`, which keeps a fluid viewport layout.
 *
 * Smaller max-widths (`max-w-3xl`, `max-w-md`, etc.) belong on inner elements
 * only — forms, error cards, chat threads, dialogs, games, and activities.
 */
export const PAGE_CONTAINER_CLASS = 'mx-auto w-full max-w-6xl'

const pageContainerVariants = cva(PAGE_CONTAINER_CLASS, {
  variants: {
    padding: {
      none: '',
      page: 'px-6',
    },
  },
  defaultVariants: {
    padding: 'none',
  },
})

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof pageContainerVariants> {
  as?: 'div' | 'main' | 'section' | 'article'
}

export function PageContainer({
  as: Component = 'div',
  padding,
  className,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(pageContainerVariants({ padding }), className)}
      {...props}
    />
  )
}
