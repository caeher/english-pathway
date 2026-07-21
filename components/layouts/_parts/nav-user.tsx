'use client'

import Link from 'next/link'
import { LogOut, Settings, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'
import { signOutAction } from '@/lib/auth/actions'

interface NavUserProps {
  email?: string | null
  fullName?: string | null
  avatarUrl?: string | null
  collapsed?: boolean
  compact?: boolean
  showDashboard?: boolean
  variant?: 'default' | 'hero'
}

export function NavUser({ email, fullName, avatarUrl, collapsed, compact = false, showDashboard = true, variant = 'default' }: NavUserProps) {
  const isHero = variant === 'hero'
  const initials = (fullName || email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-3 rounded-xl p-2 transition-colors outline-none cursor-pointer',
          isHero ? 'hover:bg-white/15 text-white' : 'hover:bg-(--bg-tertiary)',
          !compact && 'w-full',
          compact && 'max-w-48',
          collapsed && 'justify-center'
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? 'User'} />
          <AvatarFallback className={cn(
            'text-xs font-bold',
            isHero ? 'bg-white text-(--accent) shadow-sm' : 'bg-(--accent-soft) text-(--accent)'
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex flex-col items-start min-w-0 text-left">
            <span className={cn(
              'text-sm font-medium truncate w-full',
              isHero ? 'text-white font-bold' : 'text-(--text-primary)'
            )}>
              {fullName || 'User'}
            </span>
            <span className={cn(
              'text-xs truncate w-full',
              isHero ? 'text-white/80' : 'text-(--text-muted)'
            )}>
              {email}
            </span>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          {email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {showDashboard && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center text-red-500 focus:text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
