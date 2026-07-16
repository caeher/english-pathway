'use client'

import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/helpers'

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-display font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-primary) disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-transparent text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) data-[state=on]:bg-(--accent-soft) data-[state=on]:text-(--accent)',
        outline:
          'border-2 border-(--border-primary) bg-(--bg-card) text-(--text-secondary) hover:border-(--accent)/50 data-[state=on]:border-(--accent) data-[state=on]:bg-(--accent-soft) data-[state=on]:text-(--accent)',
        accent:
          'bg-(--bg-tertiary) text-(--text-secondary) hover:bg-(--bg-tertiary) data-[state=on]:bg-(--accent) data-[state=on]:text-white',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-11 px-5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

const Toggle = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))
Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
