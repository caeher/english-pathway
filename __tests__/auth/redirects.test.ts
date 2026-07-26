import { describe, expect, it } from 'vitest'
import {
  appendRedirectTo,
  getExplicitRedirectParam,
  resolvePostAuthDestination,
} from '@/lib/auth/resolve-redirect'
import { isSafeRedirectPath } from '@/lib/auth/safe-redirect'
import { getAccountPageTitle, getHeaderNavItems, isNavigationItemActive } from '@/lib/navigation-model'
import type { NavigationContext } from '@/lib/navigation'

describe('authentication redirects', () => {
  it('accepts internal destinations and rejects external or auth destinations', () => {
    expect(isSafeRedirectPath('/learn')).toBe(true)
    expect(isSafeRedirectPath('/learn?chapter=intro')).toBe(true)
    expect(isSafeRedirectPath('/curriculum')).toBe(true)
    expect(isSafeRedirectPath('/curriculum/modulo-1/m1-ch1')).toBe(true)
    expect(isSafeRedirectPath('/review')).toBe(true)
    expect(isSafeRedirectPath('/chats')).toBe(true)
    expect(isSafeRedirectPath('/chats/abc-123')).toBe(true)
    expect(isSafeRedirectPath('https://example.com')).toBe(false)
    expect(isSafeRedirectPath('//example.com')).toBe(false)
    expect(isSafeRedirectPath('/login')).toBe(false)
    expect(getExplicitRedirectParam('/register')).toBeNull()
  })

  it('uses one active-route rule for exact, nested, and query-string links', () => {
    expect(isNavigationItemActive('/learn', '/learn')).toBe(true)
    expect(isNavigationItemActive('/curriculum/a1/chapter-1', '/curriculum')).toBe(true)
    expect(isNavigationItemActive('/onboarding', '/onboarding?next=%2Flearn')).toBe(true)
    expect(isNavigationItemActive('/learn', '/review')).toBe(false)
  })

  it('sends incomplete profiles to onboarding before any requested destination', () => {
    expect(resolvePostAuthDestination('/learn', false)).toBe('/onboarding?next=%2Flearn')
    expect(resolvePostAuthDestination('/chats', false)).toBe('/onboarding?next=%2Fchats')
    expect(resolvePostAuthDestination('/onboarding', false)).toBe('/onboarding')
  })

  it('preserves a valid destination for completed profiles and falls back safely', () => {
    expect(resolvePostAuthDestination('/learn', true)).toBe('/learn')
    expect(resolvePostAuthDestination('/chats', true)).toBe('/chats')
    expect(resolvePostAuthDestination('/chats/abc-123', true)).toBe('/chats/abc-123')
    expect(resolvePostAuthDestination('https://example.com', true)).toBe('/dashboard')
    expect(resolvePostAuthDestination(null, true)).toBe('/dashboard')
  })

  it('only appends safe redirect parameters to auth links', () => {
    expect(appendRedirectTo('/login', '/learn')).toBe('/login?redirectTo=%2Flearn')
    expect(appendRedirectTo('/login', 'https://example.com')).toBe('/login')
  })

  it('shows contextual navigation for guest, setup, and ready sessions', () => {
    const context = (overrides: Partial<NavigationContext>): NavigationContext => ({
      isAuthenticated: false,
      onboardingCompleted: false,
      email: null,
      fullName: null,
      avatarUrl: null,
      ...overrides,
    })

    expect(getHeaderNavItems(context({})).map((item) => item.label)).toEqual(['Curriculum', 'Learn'])
    expect(getHeaderNavItems(context({ isAuthenticated: true })).map((item) => item.label)).toEqual(['Curriculum', 'Continue setup'])
    expect(getHeaderNavItems(context({ isAuthenticated: true, onboardingCompleted: true })).map((item) => item.label)).toEqual(['Curriculum', 'Learn', 'Review', 'Dashboard'])
  })

  it('maps account routes to navbar titles', () => {
    expect(getAccountPageTitle('/curriculum')).toBe('Curriculum')
    expect(getAccountPageTitle('/curriculum/modulo-1/m1-ch1')).toBe('Curriculum')
    expect(getAccountPageTitle('/dashboard')).toBe('Dashboard')
    expect(getAccountPageTitle('/chats/abc')).toBe('Chats')
    expect(getAccountPageTitle('/review')).toBe('Review')
    expect(getAccountPageTitle('/settings')).toBe('Settings')
    expect(getAccountPageTitle('/unknown')).toBe('Account')
  })
})
