'use client'

import React, { ReactNode } from 'react'
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface TooltipProps {
  children: ReactNode
  content: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delayDuration?: number
}

export function Tooltip({
  children,
  content,
  side = 'top',
  delayDuration = 300,
}: TooltipProps) {
  if (!content) return <>{children}</>

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} role="tooltip">
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}
