'use client'

import { Button } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteConversationDialogProps {
  open: boolean
  title: string
  isDeleting?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConversationDialog({
  open,
  title,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteConversationDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isDeleting) {
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete conversation?</DialogTitle>
          <DialogDescription>
            This will permanently delete &ldquo;{title}&rdquo;. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={isDeleting}
            loadingLabel="Deleting…"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
