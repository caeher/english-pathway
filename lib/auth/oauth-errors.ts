export const OAUTH_ERROR_CODES = {
  oauth_terms_required: 'oauth_terms_required',
  oauth_no_email: 'oauth_no_email',
  oauth_identity_linked: 'oauth_identity_linked',
  oauth_start_error: 'oauth_start_error',
  oauth_provider_denied: 'oauth_provider_denied',
  oauth_provider_disabled: 'oauth_provider_disabled',
  oauth_session_expired: 'oauth_session_expired',
  auth_callback_error: 'auth_callback_error',
  confirmation_error: 'confirmation_error',
} as const

export type OAuthErrorCode = keyof typeof OAUTH_ERROR_CODES

const OAUTH_ERROR_MESSAGES: Record<OAuthErrorCode, string> = {
  oauth_terms_required:
    'You must accept the terms and privacy policy before creating an account with Google or GitHub.',
  oauth_no_email:
    'The provider did not share a verifiable email address. Try another sign-in method or contact support.',
  oauth_identity_linked:
    'This identity is already linked to another account. Sign in with your original method.',
  oauth_start_error: 'Could not start sign-in with that provider. Please try again.',
  oauth_provider_denied:
    'Sign-in was cancelled. You can try again or use email.',
  oauth_provider_disabled:
    'That sign-in method is not available. Try email or another provider.',
  oauth_session_expired: 'Your sign-in session expired. Please try again.',
  auth_callback_error: 'Authentication could not be completed. Please try again.',
  confirmation_error: 'The confirmation link expired or is invalid.',
}

const REGISTER_ERROR_CODES = new Set<OAuthErrorCode>([
  'oauth_terms_required',
  'oauth_no_email',
])

export function getOAuthErrorMessage(code: string | null | undefined): string | undefined {
  if (!code) return undefined
  if (code in OAUTH_ERROR_MESSAGES) {
    return OAUTH_ERROR_MESSAGES[code as OAuthErrorCode]
  }
  try {
    return decodeURIComponent(code)
  } catch {
    return OAUTH_ERROR_MESSAGES.auth_callback_error
  }
}

export function getOAuthErrorRedirectPath(code: OAuthErrorCode): string {
  const path = REGISTER_ERROR_CODES.has(code) ? '/register' : '/login'
  return `${path}?error=${code}`
}

export function mapSupabaseAuthError(error: { message?: string; code?: string }): OAuthErrorCode {
  const message = (error.message ?? '').toLowerCase()
  const code = (error.code ?? '').toLowerCase()

  if (
    code.includes('identity_already_exists') ||
    code.includes('user_already_exists') ||
    message.includes('identity is already linked') ||
    message.includes('already registered')
  ) {
    return 'oauth_identity_linked'
  }

  if (
    code.includes('invalid_grant') ||
    code.includes('flow_state_expired') ||
    message.includes('expired') ||
    message.includes('code challenge') ||
    message.includes('invalid code') ||
    message.includes('code verifier')
  ) {
    return 'oauth_session_expired'
  }

  return 'auth_callback_error'
}
