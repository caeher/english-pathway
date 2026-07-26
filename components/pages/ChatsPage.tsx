'use client'

import { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { InlineError } from '@/components/ui'
import { ChatComposer } from '@/components/english-assistant/ChatComposer'
import { ConversationHistory } from '@/components/english-assistant/ConversationHistory'
import { NameConversationDialog } from '@/components/english-assistant/NameConversationDialog'
import { useConversationNaming } from '@/hooks/useConversationNaming'
import { useEnglishAssistantChat } from '@/hooks/useEnglishAssistantChat'

export default function ChatsPage() {
  const router = useRouter()

  const {
    draft,
    setDraft,
    conversations,
    isSending,
    isLoadingConversation,
    error,
    credits,
    inputRef,
    initializeConversations,
    createAndSendConversation,
  } = useEnglishAssistantChat({ autoInitialize: true, mode: 'index' })

  const {
    pendingPrompt,
    pendingTitle,
    namingError,
    isStarting,
    isNamingOpen,
    cancelNaming,
    confirmNaming,
    handlePromptSubmit,
  } = useConversationNaming({
    draft,
    setDraft,
    createAndSendConversation,
    onSuccess: (conversationId) => {
      router.push(`/chats/${conversationId}`)
    },
  })

  const noCreditsRemaining = credits?.assistantMessagesRemaining === 0

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    if (noCreditsRemaining || isSending || isLoadingConversation || isStarting) return
    handlePromptSubmit(event)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-black text-(--text-primary)">
          <MessageCircle className="h-6 w-6" aria-hidden="true" /> Chats
        </h1>
        <p className="mt-1 text-(--text-secondary)">
          Practise English with your AI helper. Start a new conversation or pick up where you left off.
          {credits ? ` · ${credits.assistantMessagesRemaining}/50 messages left` : ''}
        </p>
      </div>

      <ChatComposer
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={handleSubmit}
        disabled={isSending || isLoadingConversation || isStarting}
        isSending={isStarting}
        sendDisabled={noCreditsRemaining}
        error={noCreditsRemaining ? 'No messages remaining.' : null}
        inputRef={inputRef}
        inputId="chats-message"
        placeholder="Start a new conversation…"
      />

      {error && (
        <InlineError message={error} onRetry={() => void initializeConversations()} />
      )}

      <ConversationHistory
        conversations={conversations}
        isLoading={isLoadingConversation}
        error={null}
        onRetry={() => void initializeConversations()}
        id="chats-history"
        variant="index"
      />

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
