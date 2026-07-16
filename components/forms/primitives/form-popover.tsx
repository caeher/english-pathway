'use client'

import React, { ReactNode, useState } from 'react'
import {
  Popover as PopoverRoot,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/helpers'

export interface PopoverProps {
  trigger: ReactNode
  content: (close: () => void) => ReactNode
  matchTriggerWidth?: boolean
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
}

export function Popover({
  trigger,
  content,
  matchTriggerWidth = true,
  disabled = false,
  align = 'start',
}: PopoverProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className={cn(
          'p-3',
          matchTriggerWidth && 'w-[var(--radix-popover-trigger-width)]'
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        {content(close)}
      </PopoverContent>
    </PopoverRoot>
  )
}
