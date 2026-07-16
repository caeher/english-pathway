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
}

export function NavUser({ email, fullName, avatarUrl, collapsed }: NavUserProps) {
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
          'flex w-full items-center gap-3 rounded-xl p-2 hover:bg-(--bg-tertiary) transition-colors outline-none',
          collapsed && 'justify-center'
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? 'User'} />
          <AvatarFallback className="bg-(--accent-soft) text-(--accent) text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex flex-col items-start min-w-0 text-left">
            <span className="text-sm font-medium text-(--text-primary) truncate w-full">
              {fullName || 'User'}
            </span>
            <span className="text-xs text-(--text-muted) truncate w-full">{email}</span>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          {email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
