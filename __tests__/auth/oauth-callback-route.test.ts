import { describe, expect, it } from 'vitest'
import { resolveOAuthCallbackPreExchange } from '@/lib/auth/oauth-callback'

describe('oauth callback pre-exchange', () => {
  it('maps provider denial to oauth_provider_denied', () => {
    const params = new URLSearchParams({ error: 'access_denied' })

    expect(resolveOAuthCallbackPreExchange(params)).toEqual({
      kind: 'pre_exchange_failure',
      redirectPath: '/login?error=oauth_provider_denied',
    })
  })

  it('maps missing code to auth_callback_error', () => {
    const params = new URLSearchParams()

    expect(resolveOAuthCallbackPreExchange(params)).toEqual({
      kind: 'pre_exchange_failure',
      redirectPath: '/login?error=auth_callback_error',
    })
  })

  it('returns null when a code is present and there is no provider error', () => {
    const params = new URLSearchParams({ code: 'abc123' })

    expect(resolveOAuthCallbackPreExchange(params)).toBeNull()
  })
})
