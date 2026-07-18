import { describe, expect, it } from 'vitest'
import {
  appendRedirectTo,
  getExplicitRedirectParam,
  resolvePostAuthDestination,
} from '@/lib/auth/resolve-redirect'
import { isSafeRedirectPath } from '@/lib/auth/safe-redirect'

describe('authentication redirects', () => {
  it('accepts internal destinations and rejects external or auth destinations', () => {
    expect(isSafeRedirectPath('/learn')).toBe(true)
    expect(isSafeRedirectPath('/learn?chapter=intro')).toBe(true)
    expect(isSafeRedirectPath('https://example.com')).toBe(false)
    expect(isSafeRedirectPath('//example.com')).toBe(false)
    expect(isSafeRedirectPath('/login')).toBe(false)
    expect(getExplicitRedirectParam('/register')).toBeNull()
  })

  it('sends incomplete profiles to onboarding before any requested destination', () => {
    expect(resolvePostAuthDestination('/learn', false)).toBe('/onboarding')
    expect(resolvePostAuthDestination('/onboarding', false)).toBe('/onboarding')
  })

  it('preserves a valid destination for completed profiles and falls back safely', () => {
    expect(resolvePostAuthDestination('/learn', true)).toBe('/learn')
    expect(resolvePostAuthDestination('https://example.com', true)).toBe('/settings')
    expect(resolvePostAuthDestination(null, true)).toBe('/settings')
  })

  it('only appends safe redirect parameters to auth links', () => {
    expect(appendRedirectTo('/login', '/learn')).toBe('/login?redirectTo=%2Flearn')
    expect(appendRedirectTo('/login', 'https://example.com')).toBe('/login')
  })
})
