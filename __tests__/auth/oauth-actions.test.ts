import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.fn((path: string) => {
  throw { type: 'redirect', path }
})

const signInWithOAuth = vi.fn()

vi.mock('next/navigation', () => ({
  redirect,
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithOAuth,
    },
  })),
}))

vi.mock('@/lib/auth/oauth-registration-consent', () => ({
  setOAuthRegistrationConsentCookie: vi.fn(),
}))

const ENV_KEYS = [
  'NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED',
  'NEXT_PUBLIC_OAUTH_GITHUB_ENABLED',
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV',
] as const

let envBefore: Record<string, string | undefined>

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = snapshot[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
}

describe('oauth actions', () => {
  beforeEach(() => {
    envBefore = snapshotEnv()
    process.env.NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example'
    redirect.mockClear()
    signInWithOAuth.mockReset()
  })

  afterEach(() => {
    restoreEnv(envBefore)
  })

  it('rejects disabled providers before starting OAuth', async () => {
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = 'false'
    const { signInWithOAuthAction } = await import('@/lib/auth/actions')

    await expect(signInWithOAuthAction('google')).rejects.toMatchObject({
      type: 'redirect',
      path: '/login?error=oauth_provider_disabled',
    })
    expect(signInWithOAuth).not.toHaveBeenCalled()
  })

  it('starts OAuth with a sanitized callback URL for enabled providers', async () => {
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = 'true'
    signInWithOAuth.mockResolvedValue({
      data: { url: 'https://provider.example/oauth' },
      error: null,
    })

    const { signInWithOAuthAction } = await import('@/lib/auth/actions')

    await expect(signInWithOAuthAction('google', '/learn')).rejects.toMatchObject({
      type: 'redirect',
      path: 'https://provider.example/oauth',
    })

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://app.example/auth/callback?next=%2Flearn',
      },
    })
  })

  it('redirects to oauth_start_error when app URL is misconfigured in production', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = 'true'

    const { signInWithOAuthAction } = await import('@/lib/auth/actions')

    await expect(signInWithOAuthAction('google')).rejects.toMatchObject({
      type: 'redirect',
      path: '/login?error=oauth_start_error',
    })
    expect(signInWithOAuth).not.toHaveBeenCalled()
  })
})
