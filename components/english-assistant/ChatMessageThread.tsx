'use client'

import { RefObject } from 'react'
import { Streamdown } from 'streamdown'
import { cn } from '@/lib/helpers'
import type { ChatMessage } from '@/lib/english-assistant/constants'

interface ChatMessageThreadProps {
  messages: ChatMessage[]
  isLoading?: boolean
  isStreaming?: boolean
  endRef?: RefObject<HTMLDivElement | null>
  className?: string
  ariaLabel?: string
}

export function ChatMessageThread({
  messages,
  isLoading = false,
  isStreaming = false,
  endRef,
  className,
  ariaLabel = 'English helper conversation',
}: ChatMessageThreadProps) {
  const streamingMessageIndex = isStreaming
    ? messages.findLastIndex((message) => message.role === 'assistant')
    : -1

  return (
    <div
      className={cn('flex-1 space-y-3 overflow-y-auto', className)}
      aria-label={ariaLabel}
    >
      {isLoading && (
        <div className="text-sm text-(--text-muted)">Loading conversation…</div>
      )}
      {messages.map((message, index) => {
        const isUser = message.role === 'user'
        const isStreamingMessage = index === streamingMessageIndex
        const showAssistantPlaceholder = !isUser && isStreamingMessage && message.content.length === 0

        return (
          <article
            key={`${message.role}-${index}`}
            role="article"
            aria-label={isUser ? 'Your message' : 'Assistant reply'}
            className={cn(
              'flex max-w-[88%] flex-col gap-1',
              isUser ? 'ml-auto items-end' : 'items-start',
            )}
          >
            <span className="px-1 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              {isUser ? 'You' : 'Assistant'}
            </span>
            <div
              className={cn(
                'w-full rounded-2xl px-3 py-2.5 text-sm leading-relaxed',
                isUser
                  ? 'whitespace-pre-wrap rounded-br-md bg-(--accent) text-white'
                  : 'english-assistant-markdown rounded-bl-md bg-(--bg-tertiary) text-(--text-primary)',
              )}
            >
              {isUser ? (
                message.content
              ) : showAssistantPlaceholder ? (
                <span className="text-(--text-muted)">Thinking…</span>
              ) : (
                <Streamdown
                  mode={isStreamingMessage ? 'streaming' : 'static'}
                  isAnimating={isStreamingMessage}
                  animated={isStreamingMessage}
                >
                  {message.content}
                </Streamdown>
              )}
            </div>
          </article>
        )
      })}
      {endRef && <div ref={endRef} />}
    </div>
  )
}
