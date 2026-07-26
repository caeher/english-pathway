'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineError } from '@/components/ui'
import { cn } from '@/lib/helpers'
import type { ConversationSummary } from '@/features/english-assistant'

interface ConversationHistoryProps {
  conversations: ConversationSummary[]
  activeConversationId: string | null
  isLoading?: boolean
  error?: string | null
  onSelect: (conversationId: string) => void
  onDelete: (conversationId: string) => void
  onRetry?: () => void
  id?: string
  className?: string
  variant?: 'compact' | 'full'
}

export function ConversationHistory({
  conversations,
  activeConversationId,
  isLoading = false,
  error = null,
  onSelect,
  onDelete,
  onRetry,
  id = 'english-assistant-history',
  className,
  variant = 'full',
}: ConversationHistoryProps) {
  if (error) {
    return (
      <div className={className}>
        <InlineError message={error} onRetry={onRetry} />
      </div>
    )
  }

  return (
    <section
      id={id}
      className={cn('space-y-2', className)}
      aria-label="Conversation history"
    >
      {variant === 'full' && (
        <h2 className="font-display text-sm font-bold text-(--text-primary)">Previous conversations</h2>
      )}
      {isLoading && (
        <p className="text-sm text-(--text-muted)" aria-live="polite">Loading conversations…</p>
      )}
      {!isLoading && conversations.length === 0 && (
        <p className="px-2 py-1 text-sm text-(--text-muted)" role="status">No saved conversations yet.</p>
      )}
      <div className={cn(
        'space-y-1',
        variant === 'compact' && 'max-h-40 overflow-y-auto rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-2',
      )}>
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1',
              conversation.id === activeConversationId && 'bg-(--accent-soft)',
            )}
          >
            <button
              type="button"
              className="min-h-11 flex-1 truncate text-left text-sm text-(--text-primary)"
              onClick={() => onSelect(conversation.id)}
              aria-current={conversation.id === activeConversationId ? 'true' : undefined}
            >
              {conversation.title}
              {conversation.hasContext ? ' · activity context' : ''}
            </button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Delete conversation ${conversation.title}`}
              className="min-h-11 min-w-11 shrink-0"
              onClick={() => onDelete(conversation.id)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
