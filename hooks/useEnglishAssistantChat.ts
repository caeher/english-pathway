'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConversationSummary } from '@/features/english-assistant'
import {
  ACTIVE_CONVERSATION_KEY,
  type ChatMessage,
  type UsageCredits,
  WELCOME_MESSAGE,
  toDisplayMessages,
} from '@/lib/english-assistant/constants'
import { createAssistantStreamParser } from '@/lib/english-assistant/stream-events'

interface UseEnglishAssistantChatOptions {
  persistActiveId?: boolean
  autoInitialize?: boolean
  mode?: 'index' | 'conversation'
  conversationId?: string | null
}

export function useEnglishAssistantChat(options: UseEnglishAssistantChatOptions = {}) {
  const {
    persistActiveId = false,
    autoInitialize = false,
    mode = 'conversation',
    conversationId: initialConversationId = null,
  } = options

  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState<string | null>(null)
  const [conversationNotFound, setConversationNotFound] = useState(false)
  const [activityContextAttached, setActivityContextAttached] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [isAttachingContext, setIsAttachingContext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<UsageCredits | null>(null)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const latestAssistantReply = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'assistant') return messages[index].content
    }
    return ''
  }, [messages])

  const sendingStatus = isSending ? 'Sending your question…' : ''

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, isSending, isStreaming])

  useEffect(() => {
    void fetch('/api/credits').then(async (response) => {
      if (response.ok) setCredits(await response.json() as UsageCredits)
    }).catch(() => {})
  }, [])

  const persistActiveConversationId = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId)
    if (!persistActiveId) return
    if (conversationId) {
      window.localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationId)
    } else {
      window.localStorage.removeItem(ACTIVE_CONVERSATION_KEY)
    }
  }, [persistActiveId])

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoadingConversation(true)
    setError(null)
    setConversationNotFound(false)
    try {
      const response = await fetch(`/api/english-assistant/conversations/${conversationId}`)
      const payload = await response.json().catch(() => null) as {
        id?: string
        title?: string
        messages?: ChatMessage[]
        activityContext?: unknown
        error?: string
        code?: string
      } | null

      if (response.status === 404) {
        setConversationNotFound(true)
        setConversationTitle(null)
        throw new Error(payload?.error ?? 'Conversation not found')
      }

      if (!response.ok || !payload?.id) {
        throw new Error(payload?.error ?? 'Unable to load conversation.')
      }

      persistActiveConversationId(payload.id)
      setConversationTitle(payload.title ?? 'Conversation')
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
    setConversationNotFound(false)
    try {
      const list = await refreshConversations()

      if (mode === 'index') {
        return list
      }

      const storedId = persistActiveId ? window.localStorage.getItem(ACTIVE_CONVERSATION_KEY) : null
      const preferredId = initialConversationId
        ?? (storedId && list.some((conversation) => conversation.id === storedId)
          ? storedId
          : list[0]?.id)

      if (preferredId) {
        await loadConversation(preferredId)
      } else {
        persistActiveConversationId(null)
        setConversationTitle(null)
        setMessages([WELCOME_MESSAGE])
        setActivityContextAttached(false)
      }

      return list
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load conversations.')
      return []
    } finally {
      setIsLoadingConversation(false)
    }
  }, [initialConversationId, loadConversation, mode, persistActiveConversationId, persistActiveId, refreshConversations])

  useEffect(() => {
    if (!autoInitialize) return
    void initializeConversations()
  }, [autoInitialize, initializeConversations])

  useEffect(() => {
    if (!initialConversationId || mode !== 'conversation') return
    void refreshConversations()
    void loadConversation(initialConversationId)
  }, [initialConversationId, loadConversation, mode, refreshConversations])

  const consumeAssistantStream = useCallback(async (response: Response) => {
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null
      throw new Error(payload?.error ?? 'Unable to get an answer.')
    }

    if (!response.body) {
      throw new Error('Unable to get an answer.')
    }

    const parser = createAssistantStreamParser()
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let streamError: Error | null = null
    let donePayload: { conversationId: string; credits: UsageCredits } | null = null

    setIsStreaming(true)

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const events = parser.push(decoder.decode(value, { stream: true }))
      for (const event of events) {
        if (event.event === 'delta') {
          setMessages((current) => {
            const last = current.at(-1)
            if (!last || last.role !== 'assistant') return current
            return [...current.slice(0, -1), { role: 'assistant', content: event.data.text }]
          })
        } else if (event.event === 'done') {
          donePayload = event.data
        } else if (event.event === 'error') {
          streamError = new Error(event.data.error)
        }
      }
    }

    setIsStreaming(false)

    if (streamError) throw streamError
    if (!donePayload) throw new Error('Unable to get an answer.')

    return donePayload
  }, [])

  const sendMessageWithContent = useCallback(async (question: string, conversationId?: string | null) => {
    setMessages((current) => [
      ...current,
      { role: 'user', content: question },
      { role: 'assistant', content: '' },
    ])
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch('/api/english-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId ?? activeConversationId ?? undefined,
          message: question,
        }),
      })

      const donePayload = await consumeAssistantStream(response)

      if (donePayload.conversationId) persistActiveConversationId(donePayload.conversationId)
      setCredits(donePayload.credits)
      await refreshConversations()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to get an answer.')
      setMessages((current) => {
        const last = current.at(-1)
        if (last?.role === 'assistant' && last.content === '') {
          return current.slice(0, -2)
        }
        return current.slice(0, -1)
      })
      throw caughtError
    } finally {
      setIsSending(false)
      setIsStreaming(false)
    }
  }, [activeConversationId, consumeAssistantStream, persistActiveConversationId, refreshConversations])

  const sendMessage = useCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const question = draft.trim()
    if (!question || isSending || isLoadingConversation) return

    setDraft('')
    try {
      await sendMessageWithContent(question)
    } catch {
      setDraft(question)
    }
  }, [draft, isLoadingConversation, isSending, sendMessageWithContent])

  const createConversation = useCallback(async (title?: string) => {
    setIsLoadingConversation(true)
    setError(null)
    try {
      const response = await fetch('/api/english-assistant/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(title ? { title } : {}),
      })
      const payload = await response.json().catch(() => null) as ConversationSummary & { error?: string } | null
      if (!response.ok || !payload?.id) {
        throw new Error(payload?.error ?? 'Unable to create conversation.')
      }

      persistActiveConversationId(payload.id)
      setConversationTitle(payload.title)
      setMessages([WELCOME_MESSAGE])
      setActivityContextAttached(false)
      await refreshConversations()
      return payload
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to create conversation.')
      return null
    } finally {
      setIsLoadingConversation(false)
    }
  }, [persistActiveConversationId, refreshConversations])

  const createAndSendConversation = useCallback(async (
    title: string,
    prompt: string,
    existingConversationId?: string | null,
  ): Promise<string> => {
    let conversationId = existingConversationId ?? null
    if (!conversationId) {
      const conversation = await createConversation(title)
      if (!conversation) throw new Error('Unable to create conversation.')
      conversationId = conversation.id
    }

    try {
      await sendMessageWithContent(prompt, conversationId)
      return conversationId
    } catch (caughtError) {
      const error = new Error(
        caughtError instanceof Error ? caughtError.message : 'Could not save conversation. Try again.',
      ) as Error & { conversationId?: string }
      error.conversationId = conversationId
      throw error
    }
  }, [createConversation, sendMessageWithContent])

  const deleteConversation = useCallback(async (conversationId: string) => {
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
          persistActiveConversationId(null)
          setConversationTitle(null)
          setMessages([WELCOME_MESSAGE])
          setActivityContextAttached(false)
        }
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to delete conversation.')
    }
  }, [activeConversationId, loadConversation, persistActiveConversationId, refreshConversations])

  const attachActivityContext = useCallback(async (context: unknown) => {
    if (!activeConversationId || !context) return false

    setIsAttachingContext(true)
    setError(null)
    try {
      const response = await fetch(`/api/english-assistant/conversations/${activeConversationId}/context`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      })
      const payload = await response.json().catch(() => null) as { activityContext?: unknown; error?: string } | null
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to attach activity context.')
      }

      setActivityContextAttached(payload?.activityContext != null)
      await refreshConversations()
      return true
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to attach activity context.')
      return false
    } finally {
      setIsAttachingContext(false)
    }
  }, [activeConversationId, refreshConversations])

  return {
    draft,
    setDraft,
    messages,
    setMessages,
    conversations,
    activeConversationId,
    conversationTitle,
    conversationNotFound,
    activityContextAttached,
    setActivityContextAttached,
    isSending,
    isStreaming,
    isLoadingConversation,
    isAttachingContext,
    error,
    setError,
    credits,
    setCredits,
    endOfMessagesRef,
    inputRef,
    latestAssistantReply,
    sendingStatus,
    loadConversation,
    refreshConversations,
    initializeConversations,
    createConversation,
    deleteConversation,
    sendMessage,
    sendMessageWithContent,
    attachActivityContext,
    persistActiveConversationId,
    createAndSendConversation,
  }
}
