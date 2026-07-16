'use client'

import { cn } from '@/lib/helpers'

interface SidebarFooterProps {
  children: React.ReactNode
  collapsed?: boolean
  className?: string
}

export function SidebarFooter({ children, collapsed, className }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        'shrink-0 border-t border-(--border-primary) p-3',
        collapsed && 'flex justify-center',
        className
      )}
    >
      {children}
    </div>
  )
}
