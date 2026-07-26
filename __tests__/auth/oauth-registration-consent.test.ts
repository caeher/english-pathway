import { createHmac, randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OAuthProvider } from '@/lib/auth/oauth-providers'

const TEST_SECRET = 'test-auth-cookie-secret-with-32-characters-minimum'

describe('oauth registration consent', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_COOKIE_SECRET', TEST_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('issues and verifies a signed consent token for a provider', async () => {
    const { issueOAuthRegistrationConsent, verifyOAuthRegistrationConsent } = await import(
      '@/lib/auth/oauth-registration-consent'
    )

    const token = issueOAuthRegistrationConsent('google', '/learn')
    const payload = verifyOAuthRegistrationConsent(token, 'google')

    expect(payload).toMatchObject({
      provider: 'google',
      redirectTo: '/learn',
    })
    expect(payload?.nonce).toEqual(expect.any(String))
    expect(payload?.exp).toBeGreaterThan(Date.now())
  })

  it('rejects tampered signatures', async () => {
    const { issueOAuthRegistrationConsent, verifyOAuthRegistrationConsent } = await import(
      '@/lib/auth/oauth-registration-consent'
    )

    const token = issueOAuthRegistrationConsent('github')
    const [payload] = token.split('.')
    const tampered = `${payload}.invalid-signature`

    expect(verifyOAuthRegistrationConsent(tampered, 'github')).toBeNull()
  })

  it('rejects expired tokens', async () => {
    const { verifyOAuthRegistrationConsent } = await import('@/lib/auth/oauth-registration-consent')

    const expiredPayload = {
      provider: 'google' as OAuthProvider,
      redirectTo: null,
      nonce: randomBytes(8).toString('hex'),
      exp: Date.now() - 1_000,
    }
    const encodedPayload = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url')
    const signature = createHmac('sha256', TEST_SECRET).update(encodedPayload).digest('base64url')
    const token = `${encodedPayload}.${signature}`

    expect(verifyOAuthRegistrationConsent(token, 'google')).toBeNull()
  })

  it('rejects provider mismatches', async () => {
    const { issueOAuthRegistrationConsent, verifyOAuthRegistrationConsent } = await import(
      '@/lib/auth/oauth-registration-consent'
    )

    const token = issueOAuthRegistrationConsent('google')
    expect(verifyOAuthRegistrationConsent(token, 'github')).toBeNull()
  })

  it('sanitizes redirect destinations', async () => {
    const { issueOAuthRegistrationConsent, verifyOAuthRegistrationConsent } = await import(
      '@/lib/auth/oauth-registration-consent'
    )

    const token = issueOAuthRegistrationConsent('google', 'https://evil.test')
    const payload = verifyOAuthRegistrationConsent(token, 'google')

    expect(payload?.redirectTo).toBeNull()
  })
})
