'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, History, MessageCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ChatComposer } from '@/components/english-assistant/ChatComposer'
import { ChatMessageThread } from '@/components/english-assistant/ChatMessageThread'
import { ConversationHistory } from '@/components/english-assistant/ConversationHistory'
import { NameConversationDialog } from '@/components/english-assistant/NameConversationDialog'
import { useConversationNaming } from '@/hooks/useConversationNaming'
import { useEnglishAssistantChat } from '@/hooks/useEnglishAssistantChat'
import { WELCOME_MESSAGE } from '@/lib/english-assistant/constants'
import { buildActivityContextFromPanel, buildHintActivityContextFromPanel } from '@/lib/english-assistant/context'
import { useVisualViewportHeight } from '@/lib/ui/use-visual-viewport-height'
import {
  selectHintFallbackRequest,
  selectLastActivityResult,
  selectPanel,
  selectSetHintFallbackRequest,
  useLearnSessionStore,
} from '@/stores/useLearnSessionStore'

export default function EnglishAssistant() {
  const pathname = usePathname()
  const panel = useLearnSessionStore(selectPanel)
  const lastActivityResult = useLearnSessionStore(selectLastActivityResult)
  const hintFallbackRequest = useLearnSessionStore(selectHintFallbackRequest)
  const setHintFallbackRequest = useLearnSessionStore(selectSetHintFallbackRequest)

  const [open, setOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const viewportHeight = useVisualViewportHeight()
  const pendingHintContextRef = useRef<unknown>(null)

  const {
    draft,
    setDraft,
    messages,
    setMessages,
    conversations,
    activeConversationId,
    activityContextAttached,
    setActivityContextAttached,
    isSending,
    isStreaming,
    isLoadingConversation,
    isAttachingContext,
    error,
    setError,
    credits,
    endOfMessagesRef,
    inputRef,
    latestAssistantReply,
    sendingStatus,
    loadConversation,
    initializeConversations,
    deleteConversation,
    sendMessage,
    attachActivityContext,
    persistActiveConversationId,
    createAndSendConversation,
  } = useEnglishAssistantChat({ persistActiveId: true })

  const {
    pendingPrompt,
    pendingTitle,
    namingError,
    isStarting,
    isNamingOpen,
    openNaming,
    cancelNaming,
    confirmNaming,
    handlePromptSubmit,
  } = useConversationNaming({
    draft,
    setDraft,
    createAndSendConversation,
    onSuccess: async () => {
      if (pendingHintContextRef.current) {
        await attachActivityContext(pendingHintContextRef.current)
        pendingHintContextRef.current = null
      }
    },
  })

  const availableActivityContext = useMemo(
    () => buildActivityContextFromPanel(panel, lastActivityResult),
    [panel, lastActivityResult],
  )
  const canAttachActivityContext = pathname === '/learn' && availableActivityContext != null

  useEffect(() => {
    if (!open) return
    void initializeConversations()
  }, [open, initializeConversations])

  useEffect(() => {
    if (!hintFallbackRequest || pathname !== '/learn') return

    const request = hintFallbackRequest
    setOpen(true)
    setError(null)

    pendingHintContextRef.current = buildHintActivityContextFromPanel(
      panel,
      lastActivityResult,
      request.context,
    )
    openNaming(request.message, 'Activity help')
    setHintFallbackRequest(null)
  }, [
    hintFallbackRequest,
    lastActivityResult,
    openNaming,
    panel,
    pathname,
    setError,
    setHintFallbackRequest,
  ])

  function handleStartNewConversation() {
    persistActiveConversationId(null)
    setMessages([WELCOME_MESSAGE])
    setActivityContextAttached(false)
    setShowHistory(false)
    setDraft('')
  }

  async function handleSendMessage(event?: FormEvent<HTMLFormElement>) {
    if (!activeConversationId) {
      if (isSending || isLoadingConversation || isStarting) return
      handlePromptSubmit(event)
      return
    }
    await sendMessage(event)
  }

  function handleInputFocus() {
    window.requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      endOfMessagesRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    })
  }

  const sheetMaxHeight = viewportHeight ? `${Math.max(viewportHeight - 16, 280)}px` : undefined

  if (pathname.startsWith('/chats')) {
    return null
  }

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
                  onClick={handleStartNewConversation}
                  disabled={isLoadingConversation || isSending || isStarting}
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
              <ConversationHistory
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelect={(conversationId) => {
                  setShowHistory(false)
                  void loadConversation(conversationId)
                }}
                onDelete={(conversationId) => void deleteConversation(conversationId)}
                variant="compact"
                className="mt-3"
              />
            )}

            {canAttachActivityContext && !activityContextAttached && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 min-h-11 w-full"
                disabled={!activeConversationId || isAttachingContext || isLoadingConversation}
                onClick={() => void attachActivityContext(availableActivityContext)}
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

          <ChatMessageThread
            messages={messages}
            isLoading={isLoadingConversation}
            isStreaming={isStreaming || isStarting}
            endRef={endOfMessagesRef}
            className="px-4 py-4"
          />

          <ChatComposer
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSendMessage}
            disabled={isSending || isLoadingConversation || isStarting}
            isSending={isSending || isStarting}
            sendDisabled={credits?.assistantMessagesRemaining === 0}
            error={error}
            inputRef={inputRef}
            onInputFocus={handleInputFocus}
            className="border-t border-(--border-primary) p-3"
          />
        </SheetContent>
      </Sheet>

      <NameConversationDialog
        open={isNamingOpen}
        pendingPrompt={pendingPrompt ?? ''}
        initialTitle={pendingTitle}
        isSubmitting={isStarting}
        error={namingError}
        onCancel={cancelNaming}
        onConfirm={(title) => void confirmNaming(title)}
      />
    </div>
  )
}
