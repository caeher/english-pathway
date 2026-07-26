import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getAccountNavItems } from '@/lib/navigation'

describe('chats navigation', () => {
  it('includes Chats in account sidebar items', () => {
    const items = getAccountNavItems({
      isAuthenticated: true,
      onboardingCompleted: true,
      email: 'learner@example.com',
      fullName: 'Ada Learner',
      avatarUrl: null,
    })

    const chats = items.find((item) => item.href === '/chats')
    expect(chats).toBeDefined()
    expect(chats?.label).toBe('Chats')
    expect(chats?.icon).toBe('MessageCircle')
  })

  it('shows Chats before onboarding is complete', () => {
    const items = getAccountNavItems({
      isAuthenticated: true,
      onboardingCompleted: false,
      email: 'learner@example.com',
      fullName: null,
      avatarUrl: null,
    })

    expect(items.some((item) => item.href === '/chats')).toBe(true)
  })

  it('protects /chats in middleware auth guard', () => {
    const middleware = readFileSync(resolve(process.cwd(), 'lib/supabase/middleware.ts'), 'utf8')
    expect(middleware).toContain("pathname.startsWith('/chats')")
  })
})
