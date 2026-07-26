import { describe, expect, it } from 'vitest'
import {
  getOAuthErrorMessage,
  getOAuthErrorRedirectPath,
  mapSupabaseAuthError,
} from '@/lib/auth/oauth-errors'

describe('oauth errors', () => {
  it('returns user-facing messages for known error codes', () => {
    expect(getOAuthErrorMessage('oauth_terms_required')).toContain('accept the terms')
    expect(getOAuthErrorMessage('oauth_identity_linked')).toContain('linked to another account')
    expect(getOAuthErrorMessage('oauth_provider_denied')).toContain('cancelled')
    expect(getOAuthErrorMessage('oauth_provider_disabled')).toContain('not available')
    expect(getOAuthErrorMessage('oauth_session_expired')).toContain('expired')
  })

  it('routes register-specific errors to the register page', () => {
    expect(getOAuthErrorRedirectPath('oauth_terms_required')).toBe(
      '/register?error=oauth_terms_required',
    )
    expect(getOAuthErrorRedirectPath('oauth_identity_linked')).toBe(
      '/login?error=oauth_identity_linked',
    )
    expect(getOAuthErrorRedirectPath('oauth_provider_denied')).toBe(
      '/login?error=oauth_provider_denied',
    )
    expect(getOAuthErrorRedirectPath('oauth_provider_disabled')).toBe(
      '/login?error=oauth_provider_disabled',
    )
  })

  it('maps identity conflicts from Supabase auth errors', () => {
    expect(
      mapSupabaseAuthError({
        code: 'identity_already_exists',
        message: 'Identity is already linked',
      }),
    ).toBe('oauth_identity_linked')
  })

  it('maps expired PKCE sessions to oauth_session_expired', () => {
    expect(
      mapSupabaseAuthError({
        code: 'invalid_grant',
        message: 'PKCE flow state expired',
      }),
    ).toBe('oauth_session_expired')
  })
})
