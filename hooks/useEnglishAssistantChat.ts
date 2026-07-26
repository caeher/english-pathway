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

interface UseEnglishAssistantChatOptions {
  persistActiveId?: boolean
  autoInitialize?: boolean
}

export function useEnglishAssistantChat(options: UseEnglishAssistantChatOptions = {}) {
  const { persistActiveId = false, autoInitialize = false } = options

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
      const storedId = persistActiveId ? window.localStorage.getItem(ACTIVE_CONVERSATION_KEY) : null
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
  }, [loadConversation, persistActiveConversationId, persistActiveId, refreshConversations])

  useEffect(() => {
    if (!autoInitialize) return
    void initializeConversations()
  }, [autoInitialize, initializeConversations])

  const sendMessageWithContent = useCallback(async (question: string, conversationId?: string | null) => {
    const nextMessages = [...messages, { role: 'user' as const, content: question }]
    setMessages(nextMessages)
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
      throw caughtError
    } finally {
      setIsSending(false)
    }
  }, [activeConversationId, messages, persistActiveConversationId, refreshConversations])

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
          await createConversation()
        }
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to delete conversation.')
    }
  }, [activeConversationId, createConversation, loadConversation, refreshConversations])

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
    activityContextAttached,
    setActivityContextAttached,
    isSending,
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
  }
}
