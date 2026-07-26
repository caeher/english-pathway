'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button, InlineError } from '@/components/ui'
import { ChatComposer } from '@/components/english-assistant/ChatComposer'
import { ChatConversationHeader } from '@/components/english-assistant/ChatConversationHeader'
import { ChatConversationShell } from '@/components/english-assistant/ChatConversationShell'
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
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
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
    <ChatConversationShell
      header={(
        <ChatConversationHeader
          title={title}
          messagesRemaining={credits?.assistantMessagesRemaining}
          canDelete={Boolean(conversation)}
          deleteDisabled={isSending || isLoadingConversation}
          onDelete={async () => {
            await deleteConversation(conversationId)
            router.push('/chats')
          }}
          className="mx-auto w-full max-w-3xl"
        />
      )}
      footer={(
        <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-4 sm:py-4">
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
            variant="prompt"
          />
        </div>
      )}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {latestAssistantReply}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {sendingStatus}
      </div>

      {error && !isLoadingConversation && !conversationNotFound && messages.length <= 1 && (
        <div className="mx-auto w-full max-w-3xl px-3 pt-4 sm:px-4">
          <InlineError message={error} onRetry={() => void loadConversation(conversationId)} />
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4">
        <h2 id="active-chat-heading" className="sr-only">Active conversation</h2>
        <ChatMessageThread
          messages={messages}
          isLoading={isLoadingConversation}
          isStreaming={isStreaming}
          endRef={endOfMessagesRef}
          layout="prompt"
          ariaLabel="Chat messages"
        />
      </div>
    </ChatConversationShell>
  )
}
