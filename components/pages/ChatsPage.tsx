'use client'

import { Plus, MessageCircle } from 'lucide-react'
import { Button, InlineError, LoadingState, Surface } from '@/components/ui'
import { ChatComposer } from '@/components/english-assistant/ChatComposer'
import { ChatMessageThread } from '@/components/english-assistant/ChatMessageThread'
import { ConversationHistory } from '@/components/english-assistant/ConversationHistory'
import { useEnglishAssistantChat } from '@/hooks/useEnglishAssistantChat'

export default function ChatsPage() {
  const {
    draft,
    setDraft,
    messages,
    conversations,
    activeConversationId,
    isSending,
    isLoadingConversation,
    error,
    setError,
    credits,
    endOfMessagesRef,
    inputRef,
    latestAssistantReply,
    sendingStatus,
    loadConversation,
    initializeConversations,
    createConversation,
    deleteConversation,
    sendMessage,
  } = useEnglishAssistantChat({ autoInitialize: true })

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-black text-(--text-primary)">
            <MessageCircle className="h-6 w-6" aria-hidden="true" /> Chats
          </h1>
          <p className="mt-1 text-(--text-secondary)">
            Practise English with your AI helper. Pick up where you left off or start a new conversation.
            {credits ? ` · ${credits.assistantMessagesRemaining}/50 messages left` : ''}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => void createConversation()}
          disabled={isLoadingConversation || isSending}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> New conversation
        </Button>
      </div>

      {isLoadingConversation && conversations.length === 0 && !error && (
        <LoadingState title="Loading your conversations" description="Fetching your saved chats." lines={4} />
      )}

      {error && conversations.length === 0 && (
        <InlineError message={error} onRetry={() => void initializeConversations()} />
      )}

      {(!isLoadingConversation || conversations.length > 0 || activeConversationId) && (
        <Surface as="section" padding="lg" className="flex flex-col gap-4" aria-labelledby="active-chat-heading">
          <h2 id="active-chat-heading" className="sr-only">Active conversation</h2>

          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {latestAssistantReply}
          </div>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {sendingStatus}
          </div>

          <ChatMessageThread
            messages={messages}
            isLoading={isLoadingConversation}
            isSending={isSending}
            endRef={endOfMessagesRef}
            className="min-h-[40vh] max-h-[50vh] rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-4"
            ariaLabel="Chat messages"
          />

          <ChatComposer
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={sendMessage}
            disabled={isSending || isLoadingConversation}
            sendDisabled={credits?.assistantMessagesRemaining === 0}
            error={error && conversations.length > 0 ? error : null}
            inputRef={inputRef}
            inputId="chats-message"
            className="border-t border-(--border-primary) pt-4"
          />
        </Surface>
      )}

      <Surface as="section" padding="lg" aria-labelledby="chats-history-heading">
        <ConversationHistory
          conversations={conversations}
          activeConversationId={activeConversationId}
          isLoading={isLoadingConversation && conversations.length === 0}
          onSelect={(conversationId) => {
            setError(null)
            void loadConversation(conversationId)
          }}
          onDelete={(conversationId) => void deleteConversation(conversationId)}
          onRetry={() => void initializeConversations()}
          id="chats-history"
        />
      </Surface>
    </div>
  )
}
