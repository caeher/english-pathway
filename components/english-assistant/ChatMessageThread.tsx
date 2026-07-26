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
  layout?: 'bubble' | 'prompt'
}

export function ChatMessageThread({
  messages,
  isLoading = false,
  isStreaming = false,
  endRef,
  className,
  ariaLabel = 'English helper conversation',
  layout = 'bubble',
}: ChatMessageThreadProps) {
  const streamingMessageIndex = isStreaming
    ? messages.findLastIndex((message) => message.role === 'assistant')
    : -1

  const isPromptLayout = layout === 'prompt'

  return (
    <div
      className={cn(
        'flex-1',
        isPromptLayout ? 'space-y-8' : 'space-y-3 overflow-y-auto',
        className,
      )}
      aria-label={ariaLabel}
    >
      {isLoading && (
        <div className="text-sm text-(--text-muted)">Loading conversation…</div>
      )}
      {messages.map((message, index) => {
        const isUser = message.role === 'user'
        const isStreamingMessage = index === streamingMessageIndex
        const showAssistantPlaceholder = !isUser && isStreamingMessage && message.content.length === 0

        if (isPromptLayout) {
          return (
            <article
              key={`${message.role}-${index}`}
              role="article"
              aria-label={isUser ? 'Your message' : 'Assistant reply'}
              className={cn(
                'flex w-full',
                isUser ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  isUser
                    ? 'max-w-[85%] whitespace-pre-wrap rounded-3xl bg-(--accent-soft) px-4 py-3 text-sm leading-relaxed text-(--text-primary)'
                    : 'w-full text-sm leading-7 text-(--text-primary)',
                )}
              >
                {isUser ? (
                  message.content
                ) : showAssistantPlaceholder ? (
                  <span className="text-(--text-muted)">Thinking…</span>
                ) : (
                  <Streamdown
                    className="english-assistant-markdown chat-prompt-markdown"
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
        }

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
