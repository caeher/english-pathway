import { describe, expect, it } from 'vitest'
import { isNewAuthUser, isRecentlyCreatedUser } from '@/lib/auth/is-new-auth-user'

describe('is-new-auth-user', () => {
  const now = Date.parse('2026-07-26T12:00:00.000Z')

  it('treats recently created users within the window as recent', () => {
    expect(isRecentlyCreatedUser('2026-07-26T11:59:30.000Z', now)).toBe(true)
    expect(isRecentlyCreatedUser('2026-07-26T11:56:00.000Z', now)).toBe(false)
  })

  it('flags new users only when they are recent and lack registration consents', () => {
    expect(
      isNewAuthUser({
        createdAt: '2026-07-26T11:59:30.000Z',
        hasRegistrationConsents: false,
        now,
      }),
    ).toBe(true)

    expect(
      isNewAuthUser({
        createdAt: '2026-07-26T11:59:30.000Z',
        hasRegistrationConsents: true,
        now,
      }),
    ).toBe(false)

    expect(
      isNewAuthUser({
        createdAt: '2026-07-26T11:00:00.000Z',
        hasRegistrationConsents: false,
        now,
      }),
    ).toBe(false)
  })
})
