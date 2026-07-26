import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('conversation naming flow contracts', () => {
  const namingHook = readFileSync(resolve(process.cwd(), 'hooks/useConversationNaming.ts'), 'utf8')
  const chatHook = readFileSync(resolve(process.cwd(), 'hooks/useEnglishAssistantChat.ts'), 'utf8')
  const chatsPage = readFileSync(resolve(process.cwd(), 'components/pages/ChatsPage.tsx'), 'utf8')
  const namingDialog = readFileSync(resolve(process.cwd(), 'components/english-assistant/NameConversationDialog.tsx'), 'utf8')
  const useCases = readFileSync(resolve(process.cwd(), 'features/english-assistant/use-cases.ts'), 'utf8')

  it('reuses pending conversation id when retrying after a send failure', () => {
    expect(chatHook).toContain('existingConversationId')
    expect(chatHook).toContain('error.conversationId = conversationId')
    expect(namingHook).toContain('pendingConversationId')
    expect(namingHook).toContain('setPendingConversationId(error.conversationId)')
  })

  it('restores the draft prompt when naming is cancelled', () => {
    expect(namingHook).toContain('setDraft(pendingPrompt)')
    expect(namingDialog).toContain('onCancel')
    expect(chatsPage).toContain('onCancel={cancelNaming}')
  })

  it('preserves the title in the naming dialog during retries', () => {
    expect(namingHook).toContain('pendingTitle')
    expect(namingDialog).toContain('initialTitle')
    expect(namingDialog).toContain('setTitle(initialTitle)')
  })

  it('wires chats index through the shared naming hook', () => {
    expect(chatsPage).toContain('useConversationNaming')
    expect(chatsPage).toContain('createAndSendConversation')
    expect(chatsPage).not.toContain('setPendingPrompt')
  })

  it('requires a conversation id before sending assistant messages on the server', () => {
    expect(useCases).toContain('INVALID_INPUT')
    expect(useCases).toContain('Create one with a name before sending a message.')
    expect(useCases).not.toMatch(/if \(!conversationId\) \{[\s\S]*createEnglishAssistantConversation/)
  })
})
