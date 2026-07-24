'use client'

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, History, MessageCircle, Plus, Send, Trash2 } from 'lucide-react'
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
import type { ConversationSummary } from '@/features/english-assistant'
import { buildActivityContextFromPanel, buildHintActivityContextFromPanel } from '@/lib/english-assistant/context'
import { useVisualViewportHeight } from '@/lib/ui/use-visual-viewport-height'
import { cn } from '@/lib/helpers'
import {
  selectHintFallbackRequest,
  selectLastActivityResult,
  selectPanel,
  selectSetHintFallbackRequest,
  useLearnSessionStore,
} from '@/stores/useLearnSessionStore'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type UsageCredits = {
  assistantMessagesRemaining: number
}

const ACTIVE_CONVERSATION_KEY = 'english-assistant-active-id'

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hi! I can help you practise English grammar, vocabulary, writing, and homework. What would you like to work on?',
}

function toDisplayMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.length > 0 ? messages : [WELCOME_MESSAGE]
}

export default function EnglishAssistant() {
  const pathname = usePathname()
  const panel = useLearnSessionStore(selectPanel)
  const lastActivityResult = useLearnSessionStore(selectLastActivityResult)
  const hintFallbackRequest = useLearnSessionStore(selectHintFallbackRequest)
  const setHintFallbackRequest = useLearnSessionStore(selectSetHintFallbackRequest)

  const [open, setOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [activityContextAttached, setActivityContextAttached] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [isAttachingContext, setIsAttachingContext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<UsageCredits | null>(null)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const viewportHeight = useVisualViewportHeight()

  const availableActivityContext = useMemo(
    () => buildActivityContextFromPanel(panel, lastActivityResult),
    [panel, lastActivityResult],
  )
  const canAttachActivityContext = pathname === '/learn' && availableActivityContext != null

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

  const persistActiveConversationId = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId)
    if (conversationId) {
      window.localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationId)
    } else {
      window.localStorage.removeItem(ACTIVE_CONVERSATION_KEY)
    }
  }, [])

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoadingConversation(true)
    setError(null)
    try {
      const response = await fetch(`/api/english-assistant/conversations/${conversationId}`)
      const payload = await response.json().catch(() => null) as {
        id?: string
        messages?: ChatMessage[]
        activityContext?: unknown
        error?: string
      } | null

      if (!response.ok || !payload?.id) {
        throw new Error(payload?.error ?? 'Unable to load conversation.')
      }

      persistActiveConversationId(payload.id)
      setMessages(toDisplayMessages(payload.messages ?? []))
      setActivityContextAttached(payload.activityContext != null)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load conversation.')
    } finally {
      setIsLoadingConversation(false)
    }
  }, [persistActiveConversationId])

  const refreshConversations = useCallback(async () => {
    const response = await fetch('/api/english-assistant/conversations')
    if (!response.ok) return []
    const payload = await response.json() as ConversationSummary[]
    setConversations(payload)
    return payload
  }, [])

  const initializeConversations = useCallback(async () => {
    setIsLoadingConversation(true)
    setError(null)
    try {
      const list = await refreshConversations()
      const storedId = window.localStorage.getItem(ACTIVE_CONVERSATION_KEY)
      const preferredId = storedId && list.some((conversation) => conversation.id === storedId)
        ? storedId
        : list[0]?.id

      if (preferredId) {
        await loadConversation(preferredId)
      } else {
        persistActiveConversationId(null)
        setMessages([WELCOME_MESSAGE])
        setActivityContextAttached(false)
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load conversations.')
    } finally {
      setIsLoadingConversation(false)
    }
  }, [loadConversation, persistActiveConversationId, refreshConversations])

  useEffect(() => {
    if (!open) return
    void initializeConversations()
  }, [open, initializeConversations])

  const sendHintFallback = useCallback(async (message: string, conversationId: string) => {
    const nextMessages = [...messages, { role: 'user' as const, content: message }]
    setMessages(nextMessages)
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch('/api/english-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        answer?: string
        conversationId?: string
        error?: string
        credits?: UsageCredits
      } | null
      const answer = payload?.answer
      if (!response.ok || !answer) throw new Error(payload?.error ?? 'Unable to get an answer.')

      if (payload.conversationId) persistActiveConversationId(payload.conversationId)
      setMessages((current) => [...current, { role: 'assistant', content: answer }])
      if (payload.credits) setCredits(payload.credits)
      await refreshConversations()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to get an answer.')
      setMessages((current) => current.slice(0, -1))
    } finally {
      setIsSending(false)
    }
  }, [messages, persistActiveConversationId, refreshConversations])

  useEffect(() => {
    if (!hintFallbackRequest || pathname !== '/learn') return

    const request = hintFallbackRequest
    let cancelled = false

    async function processHintFallback() {
      setOpen(true)
      setError(null)

      let conversationId = activeConversationId
      if (!conversationId) {
        const response = await fetch('/api/english-assistant/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Activity help' }),
        })
        const payload = await response.json().catch(() => null) as ConversationSummary & { error?: string } | null
        if (!response.ok || !payload?.id) {
          if (!cancelled) setError(payload?.error ?? 'Unable to start a help conversation.')
          return
        }
        conversationId = payload.id
        if (!cancelled) {
          persistActiveConversationId(conversationId)
          setMessages([WELCOME_MESSAGE])
        }
      }

      const hintContext = buildHintActivityContextFromPanel(panel, lastActivityResult, request.context)
      if (hintContext && conversationId) {
        await fetch(`/api/english-assistant/conversations/${conversationId}/context`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: hintContext }),
        })
        if (!cancelled) setActivityContextAttached(true)
      }

      if (!cancelled) {
        setHintFallbackRequest(null)
        await sendHintFallback(request.message, conversationId)
      }
    }

    void processHintFallback()

    return () => {
      cancelled = true
    }
  }, [
    activeConversationId,
    hintFallbackRequest,
    lastActivityResult,
    panel,
    pathname,
    persistActiveConversationId,
    sendHintFallback,
    setHintFallbackRequest,
  ])

  async function createConversation() {
    setIsLoadingConversation(true)
    setError(null)
    try {
      const response = await fetch('/api/english-assistant/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const payload = await response.json().catch(() => null) as ConversationSummary & { error?: string } | null
      if (!response.ok || !payload?.id) {
        throw new Error(payload?.error ?? 'Unable to create conversation.')
      }

      persistActiveConversationId(payload.id)
      setMessages([WELCOME_MESSAGE])
      setActivityContextAttached(false)
      setShowHistory(false)
      await refreshConversations()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to create conversation.')
    } finally {
      setIsLoadingConversation(false)
    }
  }

  async function deleteConversation(conversationId: string) {
    setError(null)
    try {
      const response = await fetch(`/api/english-assistant/conversations/${conversationId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(payload?.error ?? 'Unable to delete conversation.')
      }

      const remaining = (await refreshConversations()).filter((conversation) => conversation.id !== conversationId)
      if (activeConversationId === conversationId) {
        if (remaining[0]) {
          await loadConversation(remaining[0].id)
        } else {
          await createConversation()
        }
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to delete conversation.')
    }
  }

  async function attachActivityContext() {
    if (!activeConversationId || !availableActivityContext) return

    setIsAttachingContext(true)
    setError(null)
    try {
      const response = await fetch(`/api/english-assistant/conversations/${activeConversationId}/context`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: availableActivityContext }),
      })
      const payload = await response.json().catch(() => null) as { activityContext?: unknown; error?: string } | null
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to attach activity context.')
      }

      setActivityContextAttached(payload?.activityContext != null)
      await refreshConversations()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to attach activity context.')
    } finally {
      setIsAttachingContext(false)
    }
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const question = draft.trim()
    if (!question || isSending || isLoadingConversation) return

    const nextMessages = [...messages, { role: 'user' as const, content: question }]
    setMessages(nextMessages)
    setDraft('')
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch('/api/english-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId ?? undefined,
          message: question,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        answer?: string
        conversationId?: string
        error?: string
        credits?: UsageCredits
      } | null
      const answer = payload?.answer
      if (!response.ok || !answer) throw new Error(payload?.error ?? 'Unable to get an answer.')

      if (payload.conversationId) persistActiveConversationId(payload.conversationId)
      setMessages((current) => [...current, { role: 'assistant', content: answer }])
      if (payload.credits) setCredits(payload.credits)
      await refreshConversations()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to get an answer.')
      setMessages((current) => current.slice(0, -1))
      setDraft(question)
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
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-(--accent) text-white">
                  <Bot className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <SheetTitle>English helper</SheetTitle>
                  <SheetDescription>
                    Grammar, examples, and practice{credits ? ` · ${credits.assistantMessagesRemaining}/50 messages left` : ''}
                  </SheetDescription>
                  {activityContextAttached && (
                    <p className="mt-1 text-xs font-medium text-(--accent)">Activity context attached</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Start new conversation"
                  className="min-h-11 min-w-11"
                  onClick={() => void createConversation()}
                  disabled={isLoadingConversation || isSending}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Conversation history"
                  aria-expanded={showHistory}
                  aria-controls="english-assistant-history"
                  className="min-h-11 min-w-11"
                  onClick={() => setShowHistory((current) => !current)}
                >
                  <History className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {showHistory && (
              <div
                id="english-assistant-history"
                className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-2"
                aria-label="Conversation history"
              >
                {conversations.length === 0 && (
                  <p className="px-2 py-1 text-xs text-(--text-muted)">No saved conversations yet.</p>
                )}
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
                      onClick={() => {
                        setShowHistory(false)
                        void loadConversation(conversation.id)
                      }}
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
                      onClick={() => void deleteConversation(conversation.id)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {canAttachActivityContext && !activityContextAttached && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 min-h-11 w-full"
                disabled={!activeConversationId || isAttachingContext || isLoadingConversation}
                onClick={() => void attachActivityContext()}
              >
                Use this activity as context
              </Button>
            )}
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
            {isLoadingConversation && (
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
                disabled={isSending || isLoadingConversation}
                className="min-h-11 flex-1 resize-none rounded-xl border border-(--border-primary) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                size="icon"
                type="submit"
                disabled={!draft.trim() || isSending || isLoadingConversation || credits?.assistantMessagesRemaining === 0}
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
