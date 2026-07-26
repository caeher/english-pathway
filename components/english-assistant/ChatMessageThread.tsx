'use client'

import { RefObject } from 'react'
import { Streamdown } from 'streamdown'
import { cn } from '@/lib/helpers'
import type { ChatMessage } from '@/lib/english-assistant/constants'

interface ChatMessageThreadProps {
  messages: ChatMessage[]
  isLoading?: boolean
  isSending?: boolean
  endRef?: RefObject<HTMLDivElement | null>
  className?: string
  ariaLabel?: string
}

export function ChatMessageThread({
  messages,
  isLoading = false,
  isSending = false,
  endRef,
  className,
  ariaLabel = 'English helper conversation',
}: ChatMessageThreadProps) {
  return (
    <div
      className={cn('flex-1 space-y-3 overflow-y-auto', className)}
      aria-label={ariaLabel}
    >
      {isLoading && (
        <div className="text-sm text-(--text-muted)">Loading conversation…</div>
      )}
      {messages.map((message, index) => (
        <div
          className={cn(
            'max-w-[88%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed',
            message.role === 'user'
              ? 'ml-auto whitespace-pre-wrap rounded-br-md bg-(--accent) text-white'
              : 'english-assistant-markdown rounded-bl-md bg-(--bg-tertiary) text-(--text-primary)',
          )}
          key={`${message.role}-${index}`}
        >
          {message.role === 'assistant'
            ? <Streamdown mode="streaming">{message.content}</Streamdown>
            : message.content}
        </div>
      ))}
      {isSending && (
        <div className="w-fit rounded-2xl rounded-bl-md bg-(--bg-tertiary) px-3 py-2.5 text-sm text-(--text-muted)">
          Thinking…
        </div>
      )}
      {endRef && <div ref={endRef} />}
    </div>
  )
}
