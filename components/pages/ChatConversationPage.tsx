'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Button, InlineError, Surface } from '@/components/ui'
import { ChatComposer } from '@/components/english-assistant/ChatComposer'
import { ChatMessageThread } from '@/components/english-assistant/ChatMessageThread'
import { useEnglishAssistantChat } from '@/hooks/useEnglishAssistantChat'

interface ChatConversationPageProps {
  conversationId: string
}

export default function ChatConversationPage({ conversationId }: ChatConversationPageProps) {
  const router = useRouter()
  const {
    draft,
    setDraft,
    messages,
    conversations,
    conversationTitle,
    conversationNotFound,
    isSending,
    isStreaming,
    isLoadingConversation,
    error,
    credits,
    endOfMessagesRef,
    inputRef,
    latestAssistantReply,
    sendingStatus,
    deleteConversation,
    sendMessage,
    loadConversation,
  } = useEnglishAssistantChat({
    mode: 'conversation',
    conversationId,
    persistActiveId: true,
  })

  const conversation = conversations.find((item) => item.id === conversationId)
  const title = conversationTitle ?? conversation?.title ?? 'Conversation'
  const noCreditsRemaining = credits?.assistantMessagesRemaining === 0

  if (conversationNotFound && !isLoadingConversation) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Button asChild variant="ghost" size="sm" className="min-h-11 -ml-2 w-fit">
          <Link href="/chats">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to chats
          </Link>
        </Button>
        <InlineError
          message="Conversation not found."
          onRetry={() => void loadConversation(conversationId)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="min-h-11 -ml-2">
          <Link href="/chats">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to chats
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-black text-(--text-primary)">
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
          <span className="truncate">{title}</span>
        </h1>
        {credits && (
          <p className="mt-1 text-sm text-(--text-secondary)">
            {credits.assistantMessagesRemaining}/50 messages left
          </p>
        )}
      </div>

      {error && !isLoadingConversation && !conversationNotFound && messages.length <= 1 && (
        <InlineError message={error} onRetry={() => void loadConversation(conversationId)} />
      )}

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
          isStreaming={isStreaming}
          endRef={endOfMessagesRef}
          className="min-h-[40vh] max-h-[50vh] rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-4"
          ariaLabel="Chat messages"
        />

        <ChatComposer
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={sendMessage}
          disabled={isSending || isLoadingConversation}
          isSending={isSending}
          sendDisabled={noCreditsRemaining}
          error={error && messages.length > 1 ? error : noCreditsRemaining ? 'No messages remaining.' : null}
          inputRef={inputRef}
          inputId="chat-conversation-message"
          className="border-t border-(--border-primary) pt-4"
        />

        {conversation && (
          <div className="flex justify-end border-t border-(--border-primary) pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={async () => {
                await deleteConversation(conversationId)
                router.push('/chats')
              }}
              disabled={isSending || isLoadingConversation}
            >
              Delete conversation
            </Button>
          </div>
        )}
      </Surface>
    </div>
  )
}
