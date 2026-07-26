'use client'

import { FormEvent, KeyboardEvent, RefObject } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'

interface ChatComposerProps {
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void
  disabled?: boolean
  sendDisabled?: boolean
  isSending?: boolean
  error?: string | null
  inputRef?: RefObject<HTMLTextAreaElement | null>
  onInputFocus?: () => void
  inputId?: string
  placeholder?: string
  className?: string
  variant?: 'default' | 'prompt'
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSubmit,
  disabled = false,
  sendDisabled = false,
  isSending = false,
  error = null,
  inputRef,
  onInputFocus,
  inputId = 'english-assistant-message',
  placeholder = 'Ask about English…',
  className,
  variant = 'default',
}: ChatComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void onSubmit()
    }
  }

  const isPromptVariant = variant === 'prompt'

  return (
    <form className={className} onSubmit={onSubmit}>
      {error && (
        <p className="mb-2 text-xs font-semibold text-red-600" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
      <label className="sr-only" htmlFor={inputId}>Ask an English question</label>
      <div
        className={cn(
          'flex items-end gap-2',
          isPromptVariant && 'rounded-3xl border border-(--border-primary) bg-(--bg-secondary) p-2 shadow-(--shadow-sm)',
        )}
      >
        <textarea
          id={inputId}
          ref={inputRef}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onInputFocus}
          placeholder={placeholder}
          maxLength={2_000}
          rows={isPromptVariant ? 1 : 2}
          disabled={disabled}
          className={cn(
            'min-h-11 flex-1 resize-none px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) disabled:cursor-not-allowed disabled:opacity-50',
            isPromptVariant
              ? 'border-0 bg-transparent focus:outline-none focus:ring-0'
              : 'rounded-xl border border-(--border-primary) bg-(--bg-secondary) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20',
          )}
        />
        <Button
          size="icon"
          type="submit"
          disabled={sendDisabled || !draft.trim() || disabled}
          loading={isSending}
          loadingLabel="Sending"
          aria-label="Send question"
          className={cn('min-h-11 min-w-11', isPromptVariant && 'shrink-0 rounded-2xl')}
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <p className={cn('mt-2 text-xs text-(--text-muted)', isPromptVariant && 'text-center')}>
        Press Enter to send · Shift + Enter for a new line
      </p>
    </form>
  )
}
