'use client'

import Link from 'next/link'
import { cn } from '@/lib/helpers'

interface SidebarHeaderProps {
  collapsed?: boolean
  className?: string
}

export function SidebarHeader({ collapsed, className }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex h-(--app-header-h) shrink-0 items-center border-b border-(--border-primary) px-4',
        className
      )}
    >
      <Link href="/" className="flex items-center gap-3 no-underline group">
        <div className="relative w-8 h-8 shrink-0">
          <div className="absolute inset-0 rounded-lg bg-(--accent) rotate-3 group-hover:rotate-6 transition-transform" />
          <div className="relative w-full h-full rounded-lg bg-(--accent) flex items-center justify-center">
            <span className="text-white font-display font-black text-xs">ie</span>
          </div>
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-sm text-(--text-primary) truncate">
            English Pathway
          </span>
        )}
      </Link>
    </div>
  )
}
