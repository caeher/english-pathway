import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('chats page accessibility contract', () => {
  const chatsPage = readFileSync(resolve(process.cwd(), 'components/pages/ChatsPage.tsx'), 'utf8')
  const conversationPage = readFileSync(resolve(process.cwd(), 'components/pages/ChatConversationPage.tsx'), 'utf8')
  const conversationLayout = readFileSync(resolve(process.cwd(), 'app/(account)/chats/[id]/layout.tsx'), 'utf8')
  const conversationShell = readFileSync(resolve(process.cwd(), 'components/english-assistant/ChatConversationShell.tsx'), 'utf8')
  const conversationHeader = readFileSync(resolve(process.cwd(), 'components/english-assistant/ChatConversationHeader.tsx'), 'utf8')
  const composer = readFileSync(resolve(process.cwd(), 'components/english-assistant/ChatComposer.tsx'), 'utf8')
  const thread = readFileSync(resolve(process.cwd(), 'components/english-assistant/ChatMessageThread.tsx'), 'utf8')
  const history = readFileSync(resolve(process.cwd(), 'components/english-assistant/ConversationHistory.tsx'), 'utf8')
  const namingDialog = readFileSync(resolve(process.cwd(), 'components/english-assistant/NameConversationDialog.tsx'), 'utf8')

  it('renders chats index with prompt input and flat history below', () => {
    expect(chatsPage).toContain('ChatsPage')
    expect(chatsPage).toContain('ChatComposer')
    expect(chatsPage).toContain('ConversationHistory')
    expect(chatsPage).toContain('NameConversationDialog')
    expect(chatsPage).toContain('variant="index"')
    expect(chatsPage).not.toContain('ChatMessageThread')
    expect(chatsPage).not.toContain('New conversation')
    expect(chatsPage).not.toContain('Surface')
    expect(chatsPage).toContain('id="chats-history"')
  })

  it('routes conversation detail to dedicated page with thread and composer', () => {
    expect(conversationPage).toContain('ChatMessageThread')
    expect(conversationPage).toContain('ChatComposer')
    expect(conversationPage).toContain('ChatConversationHeader')
    expect(conversationPage).toContain('ChatConversationShell')
    expect(conversationPage).toContain('layout="prompt"')
    expect(conversationPage).toContain('variant="prompt"')
    expect(conversationPage).not.toContain('Surface')
    expect(conversationPage).toContain('latestAssistantReply')
    expect(conversationPage).toContain('sendingStatus')
    expect(conversationPage).toContain('aria-live="polite"')
    expect(conversationPage).toContain('conversationTitle')
    expect(conversationPage).toContain('conversationNotFound')
    expect(conversationPage).toContain('isStreaming')
  })

  it('uses full-height conversation route layout without nested cards', () => {
    expect(conversationLayout).toContain('-mx-4')
    expect(conversationLayout).toContain('min-h-[calc(100dvh-var(--app-header-h)-2rem)]')
    expect(conversationShell).toContain('overflow-y-auto')
    expect(conversationShell).toContain('sticky bottom-0')
    expect(conversationHeader).toContain('sticky top-0')
    expect(conversationHeader).toContain('Delete conversation')
    expect(conversationHeader).toContain('DropdownMenu')
  })

  it('uses accessible composer with loading state, alert errors and touch targets', () => {
    expect(composer).toContain('role="alert"')
    expect(composer).toContain('aria-live="assertive"')
    expect(composer).toContain('min-h-11')
    expect(composer).toContain('sr-only')
    expect(composer).toContain('aria-label="Send question"')
    expect(composer).toContain('isSending')
    expect(composer).toContain('loading={isSending}')
    expect(composer).toContain('loadingLabel="Sending…"')
    expect(composer).toContain("variant?: 'default' | 'prompt'")
    expect(composer).toContain('rounded-3xl')
  })

  it('labels conversation history for screen readers and keyboard navigation', () => {
    expect(history).toContain('aria-label="Conversation history"')
    expect(history).toContain('aria-current')
    expect(history).toContain('min-h-11')
    expect(history).toContain('variant === \'index\'')
    expect(history).toContain('href={`/chats/${conversation.id}`}')
    expect(history).toContain('focus-visible:ring-2')
  })

  it('covers empty, loading, and error states', () => {
    expect(chatsPage).toContain('InlineError')
    expect(history).toContain('No saved conversations yet.')
    expect(history).toContain('Loading conversations…')
    expect(thread).toContain('Loading conversation…')
    expect(thread).toContain('Thinking…')
    expect(thread).toContain('Your message')
    expect(thread).toContain('Assistant reply')
    expect(thread).toContain('isAnimating')
    expect(thread).toContain('mode={isStreamingMessage ? \'streaming\' : \'static\'}')
    expect(thread).toContain("layout?: 'bubble' | 'prompt'")
    expect(thread).toContain('chat-prompt-markdown')
  })

  it('implements naming dialog for first prompt', () => {
    expect(namingDialog).toContain('Name this conversation')
    expect(namingDialog).toContain('Conversation name')
    expect(namingDialog).toContain('Start conversation')
    expect(namingDialog).toContain('Enter a name to continue.')
    expect(namingDialog).toContain('Cancel')
    expect(namingDialog).toContain('aria-invalid')
    expect(chatsPage).toContain('useConversationNaming')
  })

  it('exposes chats routes under the account layout', () => {
    const indexRoute = readFileSync(resolve(process.cwd(), 'app/(account)/chats/page.tsx'), 'utf8')
    const detailRoute = readFileSync(resolve(process.cwd(), 'app/(account)/chats/[id]/page.tsx'), 'utf8')
    expect(indexRoute).toContain("from '@/components/pages/ChatsPage'")
    expect(indexRoute).toContain('getCurrentUser')
    expect(detailRoute).toContain("from '@/components/pages/ChatConversationPage'")
    expect(detailRoute).toContain('notFound')
  })

  it('hides floating assistant on chats routes', () => {
    const assistant = readFileSync(resolve(process.cwd(), 'components/EnglishAssistant.tsx'), 'utf8')
    expect(assistant).toContain("pathname.startsWith('/chats')")
  })
})
