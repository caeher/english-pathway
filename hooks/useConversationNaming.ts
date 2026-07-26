'use client'

import { FormEvent, useCallback, useState } from 'react'

type CreateAndSendConversation = (
  title: string,
  prompt: string,
  existingConversationId?: string | null,
) => Promise<string>

interface UseConversationNamingOptions {
  draft: string
  setDraft: (value: string) => void
  createAndSendConversation: CreateAndSendConversation
  onSuccess?: (conversationId: string) => void | Promise<void>
}

export function useConversationNaming({
  draft,
  setDraft,
  createAndSendConversation,
  onSuccess,
}: UseConversationNamingOptions) {
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null)
  const [pendingTitle, setPendingTitle] = useState('')
  const [namingError, setNamingError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const openNaming = useCallback((prompt: string, suggestedTitle = '') => {
    setPendingPrompt(prompt)
    setPendingTitle(suggestedTitle)
    setPendingConversationId(null)
    setNamingError(null)
  }, [])

  const cancelNaming = useCallback(() => {
    if (isStarting) return
    if (pendingPrompt) {
      setDraft(pendingPrompt)
    }
    setPendingPrompt(null)
    setPendingConversationId(null)
    setPendingTitle('')
    setNamingError(null)
  }, [isStarting, pendingPrompt, setDraft])

  const confirmNaming = useCallback(async (title: string) => {
    if (!pendingPrompt) return null

    setIsStarting(true)
    setNamingError(null)
    setPendingTitle(title)

    try {
      const conversationId = await createAndSendConversation(
        title,
        pendingPrompt,
        pendingConversationId,
      )
      setPendingPrompt(null)
      setPendingConversationId(null)
      setPendingTitle('')
      await onSuccess?.(conversationId)
      return conversationId
    } catch (caughtError) {
      const error = caughtError as Error & { conversationId?: string }
      if (error.conversationId) {
        setPendingConversationId(error.conversationId)
      }
      setNamingError(error.message || 'Could not save conversation. Try again.')
      return null
    } finally {
      setIsStarting(false)
    }
  }, [createAndSendConversation, onSuccess, pendingConversationId, pendingPrompt])

  const handlePromptSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const question = draft.trim()
    if (!question || isStarting) return false

    setDraft('')
    openNaming(question)
    return true
  }, [draft, isStarting, openNaming, setDraft])

  return {
    pendingPrompt,
    pendingTitle,
    namingError,
    isStarting,
    isNamingOpen: pendingPrompt != null,
    openNaming,
    cancelNaming,
    confirmNaming,
    handlePromptSubmit,
  }
}
