'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineError } from '@/components/ui'
import { DeleteConversationDialog } from '@/components/english-assistant/DeleteConversationDialog'
import { cn } from '@/lib/helpers'
import type { ConversationSummary } from '@/features/english-assistant'

interface ConversationHistoryProps {
  conversations: ConversationSummary[]
  activeConversationId?: string | null
  isLoading?: boolean
  error?: string | null
  onSelect?: (conversationId: string) => void
  onDelete?: (conversationId: string) => void | Promise<void>
  deletingConversationId?: string | null
  onRetry?: () => void
  id?: string
  className?: string
  variant?: 'compact' | 'index' | 'full'
}

export function ConversationHistory({
  conversations,
  activeConversationId = null,
  isLoading = false,
  error = null,
  onSelect,
  onDelete,
  deletingConversationId = null,
  onRetry,
  id = 'english-assistant-history',
  className,
  variant = 'full',
}: ConversationHistoryProps) {
  const pathname = usePathname()
  const [pendingDelete, setPendingDelete] = useState<ConversationSummary | null>(null)

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await onDelete?.(pendingDelete.id)
    setPendingDelete(null)
  }

  if (error) {
    return (
      <div className={className}>
        <InlineError message={error} onRetry={onRetry} />
      </div>
    )
  }

  const heading = variant === 'index' ? 'Your conversations' : 'Previous conversations'

  return (
    <>
      <section
        id={id}
        className={cn('space-y-2', className)}
        aria-label="Conversation history"
      >
        {(variant === 'full' || variant === 'index') && (
          <h2 className="font-display text-sm font-bold text-(--text-primary)">{heading}</h2>
        )}
        {isLoading && (
          <p className="text-sm text-(--text-muted)" aria-live="polite">Loading conversations…</p>
        )}
        {!isLoading && conversations.length === 0 && (
          <p className="py-1 text-sm text-(--text-muted)" role="status">No saved conversations yet.</p>
        )}
        <ul className={cn(
          'space-y-1',
          variant === 'compact' && 'max-h-40 overflow-y-auto rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-2',
        )}>
          {conversations.map((conversation) => {
            const isActive = variant === 'index'
              ? pathname === `/chats/${conversation.id}`
              : conversation.id === activeConversationId
            const isDeleting = deletingConversationId === conversation.id

            if (variant === 'index') {
              return (
                <li
                  key={conversation.id}
                  className={cn(
                    'flex items-center gap-1 rounded-lg',
                    isActive && 'border-l-2 border-(--accent) bg-(--accent-soft) pl-0.5',
                  )}
                >
                  <Link
                    href={`/chats/${conversation.id}`}
                    className={cn(
                      'flex min-h-11 min-w-0 flex-1 items-center gap-2 truncate rounded-lg px-3 py-2 text-sm text-(--text-primary)',
                      'hover:bg-(--bg-tertiary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
                      isActive && 'font-semibold',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-(--accent)" aria-hidden="true" />
                    <span className="truncate">
                      {conversation.title}
                      {conversation.hasContext ? ' · activity context' : ''}
                    </span>
                  </Link>
                  {onDelete && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete conversation ${conversation.title}`}
                      className="min-h-11 min-w-11 shrink-0 text-red-600 hover:text-red-600"
                      disabled={isDeleting}
                      onClick={() => setPendingDelete(conversation)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                </li>
              )
            }

            return (
              <li
                key={conversation.id}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1',
                  isActive && 'bg-(--accent-soft)',
                )}
              >
                <button
                  type="button"
                  className="min-h-11 flex-1 truncate text-left text-sm text-(--text-primary)"
                  onClick={() => onSelect?.(conversation.id)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {conversation.title}
                  {conversation.hasContext ? ' · activity context' : ''}
                </button>
                {onDelete && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete conversation ${conversation.title}`}
                    className="min-h-11 min-w-11 shrink-0"
                    disabled={isDeleting}
                    onClick={() => setPendingDelete(conversation)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <DeleteConversationDialog
        open={pendingDelete != null}
        title={pendingDelete?.title ?? ''}
        isDeleting={pendingDelete != null && deletingConversationId === pendingDelete.id}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
