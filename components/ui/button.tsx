import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/helpers'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-display font-bold rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-primary) disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-(--accent) text-white hover:bg-(--accent-hover) hover:-translate-y-0.5',
        accent: 'bg-(--accent) text-white hover:bg-(--accent-hover) hover:-translate-y-0.5',
        secondary: 'bg-(--secondary) text-white hover:opacity-90 hover:-translate-y-0.5',
        soft: 'bg-(--accent-soft) text-(--accent) hover:bg-(--accent-muted)/30',
        outline:
          'border-2 border-(--border-primary) bg-(--bg-card) text-(--text-primary) hover:border-(--accent)/50 hover:bg-(--bg-tertiary)',
        ghost: 'text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)',
        destructive: 'bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5',
        reward: 'bg-(--reward) text-white hover:opacity-90 hover:-translate-y-0.5',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'accent',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
