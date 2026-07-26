import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('PageContainer convention', () => {
  const source = readFileSync(resolve(process.cwd(), 'components/ui/page-container.tsx'), 'utf8')

  it('exports the standard page width primitive', () => {
    expect(source).toContain('export const PAGE_CONTAINER_CLASS')
    expect(source).toContain('mx-auto w-full max-w-6xl')
    expect(source).toContain('export function PageContainer')
  })

  it('supports a narrow page width variant for focused layouts', () => {
    expect(source).toContain("narrow: 'max-w-3xl'")
    expect(source).toContain("default: 'max-w-6xl'")
    expect(source).toContain('/chats')
  })

  it('supports optional public page padding', () => {
    expect(source).toContain("page: 'px-6'")
    expect(source).toContain('px-6')
  })

  it('is exported from the ui barrel', () => {
    const barrel = readFileSync(resolve(process.cwd(), 'components/ui/index.ts'), 'utf8')
    expect(barrel).toContain("export { PageContainer, PAGE_CONTAINER_CLASS")
  })
})

describe('page width regression guard', () => {
  const pageFiles = [
    'components/pages/ChatConversationPage.tsx',
    'components/pages/ChatsPage.tsx',
    'components/pages/SettingsPage.tsx',
    'components/pages/FaqView.tsx',
    'components/pages/HowItWorksView.tsx',
    'components/layouts/legal-layout.tsx',
    'app/onboarding/page.tsx',
  ]

  it('uses PageContainer on migrated route shells', () => {
    for (const path of pageFiles) {
      const source = readFileSync(resolve(process.cwd(), path), 'utf8')
      expect(source, path).toContain('PageContainer')
    }
  })

  it('keeps chat thread width compact inside the page shell', () => {
    const conversationPage = readFileSync(resolve(process.cwd(), 'components/pages/ChatConversationPage.tsx'), 'utf8')
    expect(conversationPage).toContain('PageContainer')
    expect(conversationPage).toContain('CHAT_THREAD_CLASS')
    expect(conversationPage).toContain('max-w-3xl')
  })
})
