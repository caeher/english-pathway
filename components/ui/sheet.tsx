'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/helpers'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-60 bg-black/40 backdrop-blur-sm',
      'data-[state=open]:animate-overlay-show data-[state=closed]:animate-overlay-hide',
      className,
    )}
    {...props}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-60 flex flex-col overflow-hidden border border-(--border-primary) bg-(--bg-card) shadow-(--shadow-lg)',
        'data-[state=open]:animate-content-show data-[state=closed]:animate-content-hide',
        'inset-x-0 bottom-0 top-auto max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom)))] w-full rounded-t-3xl pb-[env(safe-area-inset-bottom)]',
        'sm:inset-x-auto sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:h-[min(37rem,calc(100dvh-3rem))] sm:max-h-[min(37rem,calc(100dvh-3rem))] sm:w-full sm:max-w-sm sm:rounded-3xl sm:pb-0',
        'sm:translate-x-0 sm:translate-y-0',
        className,
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close
        className={cn(
          'absolute right-4 top-4 rounded-lg p-1.5 text-(--text-muted)',
          'hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-(--accent)',
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 pr-10', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('font-display text-sm font-extrabold text-(--text-primary)', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-xs text-(--text-muted)', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
