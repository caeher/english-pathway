'use client'

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, MessageCircle, Send } from 'lucide-react'
import { Streamdown } from 'streamdown'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useVisualViewportHeight } from '@/lib/ui/use-visual-viewport-height'
import { cn } from '@/lib/helpers'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type UsageCredits = {
  assistantMessagesRemaining: number
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hi! I can help you practise English grammar, vocabulary, writing, and homework. What would you like to work on?',
}

export default function EnglishAssistant() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<UsageCredits | null>(null)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const viewportHeight = useVisualViewportHeight()

  const latestAssistantReply = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'assistant') return messages[index].content
    }
    return ''
  }, [messages])

  const sendingStatus = isSending ? 'Sending your question…' : ''

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, isSending])

  useEffect(() => {
    void fetch('/api/credits').then(async (response) => {
      if (response.ok) setCredits(await response.json() as UsageCredits)
    }).catch(() => {})
  }, [])

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const question = draft.trim()
    if (!question || isSending) return

    const nextMessages = [...messages, { role: 'user' as const, content: question }]
    setMessages(nextMessages)
    setDraft('')
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch('/api/english-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      })
      const payload = (await response.json().catch(() => null)) as { answer?: string; error?: string; credits?: UsageCredits } | null
      const answer = payload?.answer
      if (!response.ok || !answer) throw new Error(payload?.error ?? 'Unable to get an answer.')

      setMessages((current) => [...current, { role: 'assistant', content: answer }])
      if (payload.credits) setCredits(payload.credits)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to get an answer.')
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  function handleInputFocus() {
    window.requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      endOfMessagesRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    })
  }

  const sheetMaxHeight = viewportHeight ? `${Math.max(viewportHeight - 16, 280)}px` : undefined

  return (
    <div className="fixed bottom-5 right-5 z-60 sm:bottom-6 sm:right-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            size="icon"
            aria-label="Open English helper"
            className="size-12 min-h-11 min-w-11 rounded-full shadow-(--shadow-lg)"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>

        <SheetContent
          aria-label="English learning assistant"
          style={sheetMaxHeight ? { maxHeight: sheetMaxHeight } : undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <SheetHeader className="border-b border-(--border-primary) bg-(--accent-soft) px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-(--accent) text-white">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <div>
                <SheetTitle>English helper</SheetTitle>
                <SheetDescription>
                  Grammar, examples, and practice{credits ? ` · ${credits.assistantMessagesRemaining}/50 messages left` : ''}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {latestAssistantReply}
          </div>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {sendingStatus}
          </div>

          <div
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            aria-label="English helper conversation"
          >
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
            <div ref={endOfMessagesRef} />
          </div>

          <form className="border-t border-(--border-primary) p-3" onSubmit={sendMessage}>
            {error && (
              <p className="mb-2 text-xs font-semibold text-red-600" role="alert" aria-live="assertive">
                {error}
              </p>
            )}
            <label className="sr-only" htmlFor="english-assistant-message">Ask an English question</label>
            <div className="flex items-end gap-2">
              <textarea
                id="english-assistant-message"
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                placeholder="Ask about English…"
                maxLength={2_000}
                rows={2}
                disabled={isSending}
                className="min-h-11 flex-1 resize-none rounded-xl border border-(--border-primary) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                size="icon"
                type="submit"
                disabled={!draft.trim() || isSending || credits?.assistantMessagesRemaining === 0}
                aria-label="Send question"
                className="min-h-11 min-w-11"
              >
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-(--text-muted)">Press Enter to send · Shift + Enter for a new line</p>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
