'use client'

import { FormEvent, useEffect, useId, useState } from 'react'
import { z } from 'zod'
import { Button, InlineError } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createConversationSchema } from '@/features/english-assistant/contracts'

const titleSchema = createConversationSchema.shape.title

interface NameConversationDialogProps {
  open: boolean
  pendingPrompt: string
  initialTitle?: string
  isSubmitting?: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: (title: string) => void
}

export function NameConversationDialog({
  open,
  pendingPrompt,
  initialTitle = '',
  isSubmitting = false,
  error = null,
  onCancel,
  onConfirm,
}: NameConversationDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [validationError, setValidationError] = useState<string | null>(null)
  const errorId = useId()

  useEffect(() => {
    if (open) {
      setTitle(initialTitle)
      setValidationError(null)
    }
  }, [initialTitle, open])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isSubmitting) {
      onCancel()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = titleSchema.safeParse(title)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setValidationError(issue?.message === 'Too big: expected string to have <=120 characters'
        ? 'Name must be 120 characters or fewer.'
        : 'Enter a name to continue.')
      return
    }
    setValidationError(null)
    onConfirm(parsed.data!)
  }

  const displayError = validationError ?? error

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          const input = document.getElementById('conversation-name')
          if (input instanceof HTMLInputElement) input.focus()
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Name this conversation</DialogTitle>
            <DialogDescription>
              Choose a name before sending your first message.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label htmlFor="conversation-name" className="mb-2 block text-sm font-semibold text-(--text-primary)">
              Conversation name
            </label>
            <input
              id="conversation-name"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                if (validationError) setValidationError(null)
              }}
              maxLength={120}
              disabled={isSubmitting}
              aria-invalid={displayError ? true : undefined}
              aria-describedby={displayError ? errorId : undefined}
              className="min-h-11 w-full rounded-xl border border-(--border-primary) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g. Grammar questions"
            />
            {displayError && (
              <div className="mt-2" id={errorId} role="alert">
                <InlineError message={displayError} />
              </div>
            )}
            {pendingPrompt && (
              <p className="mt-3 text-xs text-(--text-muted)">
                Your message will be sent after you confirm.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              loadingLabel="Starting…"
              disabled={isSubmitting}
            >
              Start conversation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
