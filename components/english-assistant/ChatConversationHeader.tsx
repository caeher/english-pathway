'use client'

import Link from 'next/link'
import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'

interface ChatConversationHeaderProps {
  title: string
  messagesRemaining?: number
  canDelete?: boolean
  deleteDisabled?: boolean
  onDelete?: () => void
  className?: string
}

export function ChatConversationHeader({
  title,
  messagesRemaining,
  canDelete = false,
  deleteDisabled = false,
  onDelete,
  className,
}: ChatConversationHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-(--bg-primary)/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-(--bg-primary)/85 sm:px-4',
        className,
      )}
    >
      <Button asChild variant="ghost" size="sm" className="min-h-11 shrink-0 -ml-1">
        <Link href="/chats">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Back to chats</span>
        </Link>
      </Button>

      <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-(--text-primary) sm:text-base">
        {title}
      </h1>

      {messagesRemaining != null && (
        <p className="hidden shrink-0 text-xs text-(--text-muted) sm:block">
          {messagesRemaining}/50 left
        </p>
      )}

      {canDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 shrink-0"
              aria-label="Conversation options"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              disabled={deleteDisabled}
              className="cursor-pointer text-red-600 focus:text-red-600"
              onSelect={() => onDelete?.()}
            >
              Delete conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="size-11 shrink-0" aria-hidden="true" />
      )}
    </header>
  )
}
