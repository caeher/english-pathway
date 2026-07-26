import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/helpers'

/**
 * Standard outer page width for user-facing routes.
 *
 * Use `PageContainer` (or `PAGE_CONTAINER_CLASS`) as the single outer content
 * wrapper on every route except documented intentional exceptions:
 *
 * - `/learn` — fluid viewport layout (no PageContainer shell).
 * - `/chats` (index) — `size="narrow"` (`max-w-3xl`) for a focused prompting layout.
 * - `/chats/[id]` — standard `max-w-6xl` shell; thread/header/composer stay compact
 *   via inner `max-w-3xl` wrappers.
 *
 * Smaller max-widths (`max-w-3xl`, `max-w-md`, etc.) belong on inner elements
 * only — forms, error cards, chat threads, dialogs, games, and activities.
 */
export const PAGE_CONTAINER_CLASS = 'mx-auto w-full max-w-6xl'

const pageContainerVariants = cva('mx-auto w-full', {
  variants: {
    size: {
      default: 'max-w-6xl',
      narrow: 'max-w-3xl',
    },
    padding: {
      none: '',
      page: 'px-6',
    },
  },
  defaultVariants: {
    size: 'default',
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
  size,
  padding,
  className,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn(pageContainerVariants({ size, padding }), className)}
      {...props}
    />
  )
}
