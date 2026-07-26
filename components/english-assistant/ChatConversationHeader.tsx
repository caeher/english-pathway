'use client'

import { useState } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteConversationDialog } from '@/components/english-assistant/DeleteConversationDialog'
import { cn } from '@/lib/helpers'

interface ChatConversationHeaderProps {
  title: string
  canDelete?: boolean
  deleteDisabled?: boolean
  isDeleting?: boolean
  onDelete?: () => void | Promise<void>
  className?: string
}

export function ChatConversationHeader({
  title,
  canDelete = false,
  deleteDisabled = false,
  isDeleting = false,
  onDelete,
  className,
}: ChatConversationHeaderProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  async function handleConfirmDelete() {
    await onDelete?.()
    setDeleteDialogOpen(false)
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-(--bg-primary)/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-(--bg-primary)/85 sm:px-4',
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-(--accent)" aria-hidden="true" />
          <h1 className="min-w-0 truncate text-sm font-semibold text-(--text-primary) sm:text-base">
            {title}
          </h1>
        </div>

        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0 text-red-600 hover:text-red-600"
            aria-label="Delete conversation"
            disabled={deleteDisabled || isDeleting}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <div className="size-11 shrink-0" aria-hidden="true" />
        )}
      </header>

      <DeleteConversationDialog
        open={deleteDialogOpen}
        title={title}
        isDeleting={isDeleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
