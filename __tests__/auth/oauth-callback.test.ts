import type { User, UserIdentity } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const recordUserConsents = vi.fn()
const readOAuthRegistrationConsentCookie = vi.fn()
const verifyOAuthRegistrationConsent = vi.fn()
const clearOAuthRegistrationConsentCookie = vi.fn()
const createAdminClient = vi.fn()

vi.mock('@/lib/auth/consent', () => ({
  recordUserConsents,
}))

vi.mock('@/lib/auth/oauth-registration-consent', () => ({
  readOAuthRegistrationConsentCookie,
  verifyOAuthRegistrationConsent,
  clearOAuthRegistrationConsentCookie,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient,
}))

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'learner@example.com',
    created_at: new Date().toISOString(),
    app_metadata: { provider: 'google' },
    user_metadata: {},
    identities: [{ provider: 'google' } as UserIdentity],
    ...overrides,
  } as User
}

function buildSupabaseMock(options: {
  consentCount?: number
  onboardingCompleted?: boolean
}) {
  return {
    from(table: string) {
      if (table === 'user_consents') {
        return {
          select: () => ({
            eq: async () => ({
              count: options.consentCount ?? 0,
              error: null,
            }),
          }),
        }
      }

      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  onboarding_completed_at: options.onboardingCompleted
                    ? '2026-01-01T00:00:00.000Z'
                    : null,
                },
              }),
            }),
          }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    },
  }
}

describe('oauth callback handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('AUTH_COOKIE_SECRET', 'test-auth-cookie-secret-with-32-characters-minimum')
    readOAuthRegistrationConsentCookie.mockResolvedValue('consent-token')
    verifyOAuthRegistrationConsent.mockReturnValue({
      provider: 'google',
      redirectTo: null,
      nonce: 'nonce',
      exp: Date.now() + 60_000,
    })
    createAdminClient.mockReturnValue({
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('records consents for new OAuth users with valid registration consent', async () => {
    const { handleOAuthCallbackUser } = await import('@/lib/auth/oauth-callback')
    const supabase = buildSupabaseMock({ consentCount: 0, onboardingCompleted: false })

    const result = await handleOAuthCallbackUser(
      supabase as never,
      buildUser(),
      '/learn',
    )

    expect(result).toEqual({ kind: 'success', destination: '/onboarding' })
    expect(recordUserConsents).toHaveBeenCalledWith('user-1')
    expect(clearOAuthRegistrationConsentCookie).toHaveBeenCalled()
  })

  it('rejects new OAuth users without registration consent', async () => {
    const { handleOAuthCallbackUser } = await import('@/lib/auth/oauth-callback')
    verifyOAuthRegistrationConsent.mockReturnValue(null)
    const supabase = buildSupabaseMock({ consentCount: 0 })

    const result = await handleOAuthCallbackUser(
      supabase as never,
      buildUser(),
      null,
    )

    expect(result).toMatchObject({
      kind: 'failure',
      redirectPath: '/register?error=oauth_terms_required',
      shouldSignOut: true,
      shouldDeleteUser: true,
      userId: 'user-1',
    })
    expect(recordUserConsents).not.toHaveBeenCalled()
  })

  it('does not duplicate consents for existing OAuth users', async () => {
    const { handleOAuthCallbackUser } = await import('@/lib/auth/oauth-callback')
    const supabase = buildSupabaseMock({ consentCount: 2, onboardingCompleted: true })

    const result = await handleOAuthCallbackUser(
      supabase as never,
      buildUser({
        created_at: '2020-01-01T00:00:00.000Z',
      }),
      '/learn',
    )

    expect(result).toEqual({ kind: 'success', destination: '/learn' })
    expect(recordUserConsents).not.toHaveBeenCalled()
    expect(clearOAuthRegistrationConsentCookie).toHaveBeenCalled()
  })

  it('rejects OAuth users without a verifiable email', async () => {
    const { handleOAuthCallbackUser } = await import('@/lib/auth/oauth-callback')
    const supabase = buildSupabaseMock({ consentCount: 0 })

    const result = await handleOAuthCallbackUser(
      supabase as never,
      buildUser({ email: '' }),
      null,
    )

    expect(result).toMatchObject({
      kind: 'failure',
      redirectPath: '/register?error=oauth_no_email',
      shouldSignOut: true,
      shouldDeleteUser: true,
    })
  })

  it('maps identity conflicts to a recoverable login error', async () => {
    const { mapOAuthExchangeError } = await import('@/lib/auth/oauth-callback')

    expect(
      mapOAuthExchangeError({
        code: 'identity_already_exists',
        message: 'Identity is already linked',
      }),
    ).toMatchObject({
      redirectPath: '/login?error=oauth_identity_linked',
    })
  })

  it('maps expired sessions to oauth_session_expired', async () => {
    const { mapOAuthExchangeError } = await import('@/lib/auth/oauth-callback')

    expect(
      mapOAuthExchangeError({
        code: 'invalid_grant',
        message: 'PKCE flow state expired',
      }),
    ).toMatchObject({
      redirectPath: '/login?error=oauth_session_expired',
    })
  })

  it('deletes rejected OAuth users via the admin client', async () => {
    const deleteUser = vi.fn().mockResolvedValue({ error: null })
    createAdminClient.mockReturnValue({
      auth: {
        admin: {
          deleteUser,
        },
      },
    })

    const { cleanupRejectedOAuthUser } = await import('@/lib/auth/oauth-callback')
    await cleanupRejectedOAuthUser('user-1')

    expect(deleteUser).toHaveBeenCalledWith('user-1')
  })
})
