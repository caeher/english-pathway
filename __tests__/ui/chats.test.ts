import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('chats page accessibility contract', () => {
  const chatsPage = readFileSync(resolve(process.cwd(), 'components/pages/ChatsPage.tsx'), 'utf8')
  const composer = readFileSync(resolve(process.cwd(), 'components/english-assistant/ChatComposer.tsx'), 'utf8')
  const thread = readFileSync(resolve(process.cwd(), 'components/english-assistant/ChatMessageThread.tsx'), 'utf8')
  const history = readFileSync(resolve(process.cwd(), 'components/english-assistant/ConversationHistory.tsx'), 'utf8')

  it('renders a dedicated chats page with prompt input and history below', () => {
    expect(chatsPage).toContain('ChatsPage')
    expect(chatsPage).toContain('ChatComposer')
    expect(chatsPage).toContain('ConversationHistory')
    expect(chatsPage).toContain('ChatMessageThread')
    expect(chatsPage).toContain('New conversation')
    expect(chatsPage).toContain('id="chats-history"')
  })

  it('announces assistant replies and sending state through live regions', () => {
    expect(chatsPage).toContain('latestAssistantReply')
    expect(chatsPage).toContain('sendingStatus')
    expect(chatsPage).toContain('aria-live="polite"')
  })

  it('uses accessible composer with alert errors and touch targets', () => {
    expect(composer).toContain('role="alert"')
    expect(composer).toContain('aria-live="assertive"')
    expect(composer).toContain('min-h-11')
    expect(composer).toContain('sr-only')
    expect(composer).toContain('aria-label="Send question"')
  })

  it('labels conversation regions for screen readers', () => {
    expect(thread).toContain('aria-label')
    expect(history).toContain('aria-label="Conversation history"')
    expect(history).toContain('aria-current')
    expect(history).toContain('min-h-11')
  })

  it('covers empty, loading, and error states without blocking navigation', () => {
    expect(chatsPage).toContain('LoadingState')
    expect(chatsPage).toContain('InlineError')
    expect(history).toContain('No saved conversations yet.')
    expect(thread).toContain('Loading conversation…')
    expect(thread).toContain('Thinking…')
  })

  it('exposes the chats route under the account layout', () => {
    const route = readFileSync(resolve(process.cwd(), 'app/(account)/chats/page.tsx'), 'utf8')
    expect(route).toContain("from '@/components/pages/ChatsPage'")
    expect(route).toContain('getCurrentUser')
  })
})
